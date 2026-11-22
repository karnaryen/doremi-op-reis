<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Assignment;
use App\Entity\RecordingKind;
use App\Exception\RuleViolation;
use App\Upload\FileRule;
use App\Upload\Uploads;
use App\View\UploadUrlView;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\OptimisticLockException;
use Psr\Clock\ClockInterface;

/**
 * The recordings of a child (docs/tech/architecture.md, "Upload flow").
 * The controller has already checked that the user is the parent of this Assignment (AssignmentVoter).
 */
final readonly class RecordingUploads
{
    /** The key prefix of recordings in the bucket (docs/tech/data-model.md). */
    public const string FINAL_PREFIX = 'recordings/';

    public function __construct(
        private Uploads $uploads,
        private EntityManagerInterface $entityManager,
        private ClockInterface $clock,
    ) {
    }

    /** @throws RuleViolation the Assignment is completed, or the file is not accepted */
    public function createUploadUrl(Assignment $assignment, RecordingKind $kind, string $mimeType, int $size): UploadUrlView
    {
        if (!$assignment->canReceiveRecording()) {
            throw RuleViolation::assignmentCompleted();
        }

        return $this->uploads->createUploadUrl(self::temporaryPrefix($assignment, $kind), [self::rule($kind)], $mimeType, $size);
    }

    /**
     * The browser has sent the file to the storage. This method makes it the recording of the Assignment.
     *
     * 1. Copy the upload to a final key and check the copy (Uploads::accept).
     * 2. Save the row: the status becomes "Sent". A recording of the same kind is replaced.
     * 3. Only now delete the old file and the temporary upload. If step 1 or 2 fails, the old recording stays
     *    (docs/product/assignment-lifecycle.md, "Replacing a recording").
     *
     * @throws RuleViolation the Assignment is completed, the upload does not exist, the file is not accepted,
     *                       or another request changed the Assignment at the same moment
     */
    public function confirm(Assignment $assignment, RecordingKind $kind, string $uploadId): void
    {
        if (!$assignment->canReceiveRecording()) {
            throw RuleViolation::assignmentCompleted();
        }

        $temporaryKey = self::temporaryPrefix($assignment, $kind).$uploadId;
        $file = $this->uploads->accept($temporaryKey, self::FINAL_PREFIX, [self::rule($kind)]);

        try {
            $replacedKey = $assignment->submitRecording($kind, $file, $this->clock->now());
            $this->entityManager->flush();
        } catch (\Throwable $e) {
            // The row was not saved, so the new file must not stay.
            $this->uploads->discard($file->objectKey);

            // The teacher completed the Assignment at this moment, or a second upload came in at the same time.
            if ($e instanceof OptimisticLockException || $e instanceof UniqueConstraintViolationException) {
                throw RuleViolation::changedMeanwhile();
            }

            throw $e;
        }

        $this->uploads->discard($temporaryKey);
        if (null !== $replacedKey) {
            $this->uploads->discard($replacedKey);
        }
    }

    /**
     * Where the uploads of one Assignment wait until they are confirmed, for both kinds.
     * ParentAccounts::delete() empties it: a video that was uploaded but never confirmed has no database row.
     */
    public static function temporaryPrefixOf(int $assignmentId): string
    {
        return \sprintf('uploads/recordings/%d/', $assignmentId);
    }

    private static function rule(RecordingKind $kind): FileRule
    {
        return match ($kind) {
            RecordingKind::Video => FileRule::Video,
            RecordingKind::Audio => FileRule::Audio,
        };
    }

    /**
     * The temporary key has the id of the Assignment and the kind. confirm() builds the same key from the Assignment
     * that the voter has checked, so a parent can only confirm an upload that was made for this Assignment.
     */
    private static function temporaryPrefix(Assignment $assignment, RecordingKind $kind): string
    {
        return self::temporaryPrefixOf((int) $assignment->getId()).$kind->value.'/';
    }
}
