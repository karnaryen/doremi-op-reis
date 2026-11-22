<?php

declare(strict_types=1);

namespace App\Storage;

use Aws\Exception\AwsException;
use Aws\S3\S3ClientInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * ObjectStorage on the S3 API. In this app the server is Cloudflare R2.
 *
 * Signed URLs are made on this server from the secret key: no request goes to R2.
 * getInfo() and delete() send one request to R2 each.
 */
final readonly class S3ObjectStorage implements ObjectStorage
{
    public function __construct(
        private S3ClientInterface $client,
        #[Autowire(env: 'R2_BUCKET')]
        private string $bucket,
    ) {
    }

    public function createUploadUrl(string $key, int $ttlSeconds): string
    {
        return $this->createUrl('PutObject', $key, $ttlSeconds);
    }

    public function createDownloadUrl(string $key, int $ttlSeconds): string
    {
        return $this->createUrl('GetObject', $key, $ttlSeconds);
    }

    public function getInfo(string $key): ?ObjectInfo
    {
        try {
            $result = $this->client->headObject($this->target($key));
        } catch (AwsException $e) {
            if (404 === $e->getStatusCode()) {
                return null;
            }

            throw self::failed('read', $key, $e);
        }

        $size = $result['ContentLength'] ?? null;
        $contentType = $result['ContentType'] ?? null;

        // No guess for a missing size: the caller uses it to refuse files that are too large.
        if (!is_numeric($size)) {
            throw new StorageException(\sprintf('The storage sent no size for the object "%s".', $key));
        }

        return new ObjectInfo((int) $size, \is_string($contentType) ? $contentType : 'application/octet-stream');
    }

    public function delete(string $key): void
    {
        try {
            $this->client->deleteObject($this->target($key));
        } catch (AwsException $e) {
            throw self::failed('delete', $key, $e);
        }
    }

    private function createUrl(string $operation, string $key, int $ttlSeconds): string
    {
        if ($ttlSeconds < 1 || $ttlSeconds > self::MAX_URL_TTL_SECONDS) {
            throw new \InvalidArgumentException(\sprintf('A signed URL lives from 1 to %d seconds, got %d.', self::MAX_URL_TTL_SECONDS, $ttlSeconds));
        }

        try {
            $command = $this->client->getCommand($operation, $this->target($key));
            // A string, not the number: the SDK reads a number as a Unix timestamp.
            $request = $this->client->createPresignedRequest($command, \sprintf('+%d seconds', $ttlSeconds));
        } catch (AwsException $e) {
            throw self::failed('sign a URL for', $key, $e);
        }

        return (string) $request->getUri();
    }

    /**
     * @return array{Bucket: string, Key: string}
     */
    private function target(string $key): array
    {
        if ('' === $this->bucket) {
            throw StorageException::notConfigured();
        }

        if ('' === $key) {
            throw new \InvalidArgumentException('The object key is empty.');
        }

        return ['Bucket' => $this->bucket, 'Key' => $key];
    }

    private static function failed(string $action, string $key, AwsException $e): StorageException
    {
        // The AWS error code (for example "AccessDenied") is enough to find the cause.
        // An answer to HEAD has no body and so no code: then the HTTP status says what happened.
        // The full SDK message can contain the request, so it stays in "previous" for the log.
        $status = $e->getStatusCode();
        $reason = $e->getAwsErrorCode() ?? (null !== $status ? 'HTTP '.$status : 'no answer from the storage');

        return new StorageException(\sprintf('Could not %s the object "%s": %s.', $action, $key, $reason), previous: $e);
    }
}
