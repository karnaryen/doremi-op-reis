<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Assignment;
use App\Entity\RecordingKind;
use App\Exception\RuleViolation;
use App\Storage\ObjectStorage;
use App\View\DownloadUrlView;

/**
 * Short-lived links to private files (docs/tech/architecture.md, "Playback flow").
 * The controller has already checked that the user may see the Assignment (AssignmentVoter);
 * the file is always looked up through this Assignment, never by a key or an id alone.
 */
final readonly class FileLinks
{
    /** One hour: long enough to watch a video with pauses. The browser asks for a new link after that. */
    public const int DOWNLOAD_URL_TTL_SECONDS = 3600;

    public function __construct(private ObjectStorage $storage)
    {
    }

    /** @throws RuleViolation the Assignment has no recording of this kind */
    public function forRecording(Assignment $assignment, RecordingKind $kind): DownloadUrlView
    {
        $recording = $assignment->getSubmission()?->getRecording($kind);
        if (null === $recording) {
            throw RuleViolation::fileNotFound();
        }

        return $this->link($recording->getFile()->objectKey);
    }

    /** @throws RuleViolation the Material of this Assignment has no such file */
    public function forMaterialFile(Assignment $assignment, int $fileId): DownloadUrlView
    {
        foreach ($assignment->getMaterial()->getFiles() as $file) {
            if ($file->getId() === $fileId) {
                return $this->link($file->getFile()->objectKey);
            }
        }

        throw RuleViolation::fileNotFound();
    }

    private function link(string $key): DownloadUrlView
    {
        return new DownloadUrlView($this->storage->createDownloadUrl($key, self::DOWNLOAD_URL_TTL_SECONDS), self::DOWNLOAD_URL_TTL_SECONDS);
    }
}
