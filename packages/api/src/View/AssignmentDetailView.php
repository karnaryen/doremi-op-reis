<?php

declare(strict_types=1);

namespace App\View;

use App\Entity\Assignment;
use App\Entity\MaterialFile;
use App\Entity\PieceStatus;
use App\Entity\Recording;

/**
 * JSON answer: one Assignment with everything the piece card and the review screen show.
 *
 * It has no file URLs. The browser asks for a short-lived URL when the user opens a file
 * (RecordingController::downloadUrl, MaterialFileController::downloadUrl), and the access is checked again then.
 */
final readonly class AssignmentDetailView
{
    /**
     * @param list<array{id: int, purpose: string, mimeType: string, size: int, position: int|null}> $materialFiles
     * @param list<array{kind: string, mimeType: string, size: int, uploadedAt: \DateTimeImmutable}> $recordings
     * @param array{text: string, updatedAt: \DateTimeImmutable, forPreviousAttempt: bool}|null      $feedback
     */
    private function __construct(
        public int $id,
        public string $title,
        public PieceStatus $status,
        public int $studentId,
        public string $studentName,
        public ?string $generalInstruction,
        public ?string $personalInstruction,
        public ?string $parentHint,
        public array $materialFiles,
        public array $recordings,
        public ?array $feedback,
        public \DateTimeImmutable $createdAt,
        public ?\DateTimeImmutable $submittedAt,
        public ?\DateTimeImmutable $completedAt,
        public ?\DateTimeImmutable $deleteAt,
        /** Changes with every change of the Assignment. A review sends it back (ReviewRequest). */
        public int $version,
    ) {
    }

    public static function of(Assignment $assignment): self
    {
        $material = $assignment->getMaterial();
        $submission = $assignment->getSubmission();
        $feedback = $assignment->getFeedback();

        return new self(
            (int) $assignment->getId(),
            $material->getTitle(),
            $assignment->getPieceStatus(),
            (int) $assignment->getStudent()->getId(),
            $assignment->getStudent()->getName(),
            $material->getGeneralInstruction(),
            $assignment->getPersonalInstruction(),
            $assignment->getParentHint(),
            array_map(static fn (MaterialFile $file): array => [
                'id' => (int) $file->getId(),
                'purpose' => $file->getPurpose()->value,
                'mimeType' => $file->getFile()->mimeType,
                'size' => $file->getFile()->size,
                'position' => $file->getPosition(),
            ], $material->getFiles()),
            array_map(static fn (Recording $recording): array => [
                'kind' => $recording->getKind()->value,
                'mimeType' => $recording->getFile()->mimeType,
                'size' => $recording->getFile()->size,
                'uploadedAt' => $recording->getFile()->uploadedAt,
            ], $submission?->getRecordings() ?? []),
            null === $feedback ? null : [
                'text' => $feedback->getText(),
                'updatedAt' => $feedback->getUpdatedAt(),
                'forPreviousAttempt' => $assignment->hasFeedbackForPreviousAttempt(),
            ],
            $assignment->getCreatedAt(),
            $submission?->getSubmittedAt(),
            $assignment->getCompletedAt(),
            $assignment->getDeleteAt(),
            $assignment->getVersion(),
        );
    }
}
