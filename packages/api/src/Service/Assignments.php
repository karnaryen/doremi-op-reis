<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\CreateAssignmentRequest;
use App\Dto\ReviewAction;
use App\Entity\Assignment;
use App\Entity\Material;
use App\Entity\StoredObject;
use App\Entity\User;
use App\Exception\RuleViolation;
use App\Repository\StudentRepository;
use App\Upload\FileRule;
use App\Upload\Uploads;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\OptimisticLockException;
use Psr\Clock\ClockInterface;

/** "Assign a piece" and the review of the teacher (docs/product/features.md). */
final readonly class Assignments
{
    public function __construct(
        private StudentRepository $students,
        private EntityManagerInterface $entityManager,
        private Uploads $uploads,
        private ClockInterface $clock,
    ) {
    }

    /**
     * Creates the Material with its files and the Assignment of one student.
     *
     * Steps: 1) move every uploaded file to its final key and check it, 2) save all rows in one transaction (flush),
     * 3) delete the temporary objects. If step 1 or 2 fails, the files that step 1 has moved are deleted again,
     * so no file stays without a row.
     *
     * @throws RuleViolation the student is not a student of this teacher, or a file is not accepted
     */
    public function create(User $teacher, CreateAssignmentRequest $request): Assignment
    {
        $student = $this->students->find($request->studentId);
        // The same answer for "does not exist" and "belongs to another teacher".
        if (null === $student || !$student->isTaughtBy($teacher)) {
            throw RuleViolation::studentNotFound();
        }

        $now = $this->clock->now();
        $material = new Material($teacher, trim($request->title), self::nullIfBlank($request->generalInstruction), $now);
        $assignment = new Assignment($student, $material, self::nullIfBlank($request->personalInstruction), self::nullIfBlank($request->parentHint), $now);

        // What must be cleaned up: the temporary uploads after success, the accepted copies after a failure.
        $temporaryKeys = [];
        $accepted = [];

        try {
            $sheetMusic = [];
            foreach ($request->sheetMusicUploadIds as $uploadId) {
                $temporaryKeys[] = $temporaryKey = MaterialUploads::sheetMusicPrefix($teacher).$uploadId;
                $accepted[] = $sheetMusic[] = $this->uploads->accept($temporaryKey, MaterialUploads::FINAL_PREFIX, MaterialUploads::SHEET_MUSIC_RULES);
            }
            self::checkSheetMusic($sheetMusic);
            foreach ($sheetMusic as $index => $file) {
                $material->addSheetMusic($file, $index + 1);
            }

            if (null !== $request->audioExampleUploadId) {
                $temporaryKeys[] = $temporaryKey = MaterialUploads::audioExamplePrefix($teacher).$request->audioExampleUploadId;
                $accepted[] = $audioExample = $this->uploads->accept($temporaryKey, MaterialUploads::FINAL_PREFIX, MaterialUploads::AUDIO_EXAMPLE_RULES);
                $material->setAudioExample($audioExample);
            }

            // One flush() is one transaction: the Material, its files and the Assignment are saved together or not at all.
            $this->entityManager->persist($material);
            $this->entityManager->persist($assignment);
            $this->entityManager->flush();
        } catch (\Throwable $e) {
            $this->uploads->discard(...array_map(static fn (StoredObject $file): string => $file->objectKey, $accepted));

            throw $e;
        }

        $this->uploads->discard(...$temporaryKeys);

        return $assignment;
    }

    /**
     * "Complete" or "Ask to try again". Both save the feedback.
     *
     * $seenVersion is the version of the Assignment that the teacher has on the screen. It must still be
     * the current one: if the parent sent a new recording after the teacher opened the screen, the feedback
     * would be saved for a recording that the teacher has not seen.
     *
     * @throws RuleViolation the Assignment is completed, there is nothing to review,
     *                       or the Assignment was changed after the teacher opened it
     */
    public function review(Assignment $assignment, ReviewAction $action, string $feedback, int $seenVersion): void
    {
        try {
            // Compares $seenVersion with the version that Doctrine has just read from the database.
            $this->entityManager->lock($assignment, LockMode::OPTIMISTIC, $seenVersion);
        } catch (OptimisticLockException) {
            throw RuleViolation::changedMeanwhile();
        }

        if ($assignment->isCompleted()) {
            throw RuleViolation::assignmentCompleted();
        }

        if (ReviewAction::TryAgain === $action && !$assignment->isWaitingForReview()) {
            throw RuleViolation::nothingToReview();
        }

        $now = $this->clock->now();
        match ($action) {
            ReviewAction::Complete => $assignment->complete(trim($feedback), $now),
            ReviewAction::TryAgain => $assignment->askToTryAgain(trim($feedback), $now),
        };

        try {
            $this->entityManager->flush();
        } catch (OptimisticLockException) {
            // Another request changed the Assignment between "read" and "save" of this request.
            throw RuleViolation::changedMeanwhile();
        }
    }

    /** @param list<StoredObject> $files */
    private static function checkSheetMusic(array $files): void
    {
        $pdfs = \count(array_filter($files, static fn (StoredObject $file): bool => null !== FileRule::forMimeType([FileRule::SheetMusicPdf], $file->mimeType)));

        // One PDF, or only images (docs/tech/data-model.md, "Rules in the service").
        if ($pdfs > 1 || ($pdfs > 0 && $pdfs < \count($files))) {
            throw RuleViolation::sheetMusicMixed();
        }
    }

    private static function nullIfBlank(?string $text): ?string
    {
        $text = trim($text ?? '');

        return '' === $text ? null : $text;
    }
}
