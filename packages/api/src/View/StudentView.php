<?php

declare(strict_types=1);

namespace App\View;

use App\Entity\Assignment;
use App\Entity\Student;

/** JSON answer: a student with the parent, for the teacher. */
final readonly class StudentView
{
    /** @param list<AssignmentSummaryView>|null $assignments */
    private function __construct(
        public int $id,
        public string $name,
        public ParentView $parent,
        /** Only on the screen of one student; null in the list of students. */
        public ?array $assignments,
        /** Only in the answer to "add parent" and "send again": false if the email could not be sent. */
        public ?bool $invitationSent,
    ) {
    }

    public static function of(Student $student, ?bool $invitationSent = null): self
    {
        return new self((int) $student->getId(), $student->getName(), ParentView::of($student->getParent()), null, $invitationSent);
    }

    /** @param list<Assignment> $assignments */
    public static function withAssignments(Student $student, array $assignments): self
    {
        return new self(
            (int) $student->getId(),
            $student->getName(),
            ParentView::of($student->getParent()),
            array_map(AssignmentSummaryView::of(...), $assignments),
            null,
        );
    }
}
