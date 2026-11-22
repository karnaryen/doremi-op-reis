<?php

declare(strict_types=1);

namespace App\View;

use App\Entity\Assignment;
use App\Entity\PieceStatus;

/** JSON answer: one row in a list of Assignments. */
final readonly class AssignmentSummaryView
{
    private function __construct(
        public int $id,
        public string $title,
        public PieceStatus $status,
        public int $studentId,
        public string $studentName,
        public \DateTimeImmutable $createdAt,
        /** When the latest recording came in; null if there is none. */
        public ?\DateTimeImmutable $submittedAt,
        public ?\DateTimeImmutable $completedAt,
        /** A completed Assignment is deleted on this day. */
        public ?\DateTimeImmutable $deleteAt,
    ) {
    }

    public static function of(Assignment $assignment): self
    {
        return new self(
            (int) $assignment->getId(),
            $assignment->getMaterial()->getTitle(),
            $assignment->getPieceStatus(),
            (int) $assignment->getStudent()->getId(),
            $assignment->getStudent()->getName(),
            $assignment->getCreatedAt(),
            $assignment->getSubmission()?->getSubmittedAt(),
            $assignment->getCompletedAt(),
            $assignment->getDeleteAt(),
        );
    }
}
