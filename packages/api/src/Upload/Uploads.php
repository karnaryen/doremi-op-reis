<?php

declare(strict_types=1);

namespace App\Upload;

use App\Entity\StoredObject;
use App\Exception\RuleViolation;
use App\Storage\ObjectStorage;
use App\Storage\StorageException;
use App\View\UploadUrlView;
use Psr\Clock\ClockInterface;
use Psr\Log\LoggerInterface;

/**
 * The two steps that every upload has (docs/tech/architecture.md, "Upload flow"):
 *
 * 1. createUploadUrl(): the browser gets a signed URL and sends the file directly to the storage,
 *    under a temporary key ("uploads/...").
 * 2. accept(): the server copies the object to its final key, checks the copy and returns its metadata.
 *
 * Why a copy: the upload URL works until it expires, so the temporary object can still be replaced after a check.
 * No upload URL exists for the final key, so the checked file cannot change (docs/tech/backend.md, "Signed URLs").
 */
final readonly class Uploads
{
    /** A short life: the URL only has to be valid when the upload starts. */
    public const int UPLOAD_URL_TTL_SECONDS = 900;

    public function __construct(
        private ObjectStorage $storage,
        private ClockInterface $clock,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * @param string         $temporaryPrefix where the upload goes, for example "uploads/recordings/12/video/"
     * @param list<FileRule> $rules           the kinds of files that are allowed here
     *
     * @throws RuleViolation    the type or the size is not allowed
     * @throws StorageException
     */
    public function createUploadUrl(string $temporaryPrefix, array $rules, string $mimeType, int $size): UploadUrlView
    {
        self::check($rules, $mimeType, $size);

        // 32 random hex characters: nobody can guess the key of another upload.
        $uploadId = bin2hex(random_bytes(16));

        return new UploadUrlView(
            $uploadId,
            $this->storage->createUploadUrl($temporaryPrefix.$uploadId, self::UPLOAD_URL_TTL_SECONDS),
            self::UPLOAD_URL_TTL_SECONDS,
        );
    }

    /**
     * Moves an uploaded object to a final key and checks it. The temporary object stays:
     * the caller deletes it with discard() when the database row is saved.
     *
     * @param list<FileRule> $rules
     *
     * @throws RuleViolation    no such upload, or the file is not allowed (the copy is deleted then)
     * @throws StorageException
     */
    public function accept(string $temporaryKey, string $finalPrefix, array $rules): StoredObject
    {
        $finalKey = $finalPrefix.bin2hex(random_bytes(16));

        if (!$this->storage->copy($temporaryKey, $finalKey)) {
            throw RuleViolation::uploadNotFound();
        }

        try {
            $info = $this->storage->getInfo($finalKey);
            if (null === $info) {
                throw RuleViolation::uploadNotFound();
            }

            // The storage does not look into the file: the type is what the uploader sent.
            // The check still stops a file that our own form would never send.
            self::check($rules, $info->contentType, $info->size);
        } catch (\Throwable $e) {
            $this->discard($finalKey, $temporaryKey);

            throw $e;
        }

        return new StoredObject($finalKey, FileRule::normalizeMimeType($info->contentType), $info->size, $this->clock->now());
    }

    /**
     * Deletes objects that have no database row (any more). It never throws: the request has done its work,
     * and a failed deletion must not turn it into an error. An object that stays is found by the
     * daily job (docs/tech/architecture.md, "Daily deletion job"; roadmap phase 5).
     */
    public function discard(string ...$keys): void
    {
        foreach ($keys as $key) {
            try {
                $this->storage->delete($key);
            } catch (StorageException $e) {
                $this->logger->warning('Could not delete the object "{key}" from the storage.', ['key' => $key, 'exception' => $e]);
            }
        }
    }

    /**
     * Deletes all temporary uploads under a prefix. Like discard(), it never throws.
     * It is for uploads that were never confirmed: they have no database row that names their key.
     */
    public function discardPrefix(string ...$prefixes): void
    {
        foreach ($prefixes as $prefix) {
            try {
                $this->storage->deletePrefix($prefix);
            } catch (StorageException $e) {
                $this->logger->warning('Could not delete the objects under "{prefix}" from the storage.', ['prefix' => $prefix, 'exception' => $e]);
            }
        }
    }

    /** @param list<FileRule> $rules */
    private static function check(array $rules, string $mimeType, int $size): void
    {
        $rule = FileRule::forMimeType($rules, $mimeType);
        if (null === $rule) {
            throw RuleViolation::fileNotAccepted(\sprintf('Files of the type "%s" are not accepted here.', FileRule::normalizeMimeType($mimeType)));
        }

        if (!$rule->allowsSize($size)) {
            throw RuleViolation::fileNotAccepted(\sprintf('The file is empty or larger than %d MB.', intdiv($rule->maxBytes(), 1024 * 1024)));
        }
    }
}
