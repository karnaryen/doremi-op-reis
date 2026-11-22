<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\AssignmentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One Material given to one student, with a personal instruction, a parent hint and a status.
 * In the UI it is a "piece card".
 *
 * The rules of the lifecycle are methods of this class (submitRecording, askToTryAgain, complete),
 * so no service can put an Assignment into a state that the product does not have
 * (docs/product/assignment-lifecycle.md).
 */
#[ORM\Entity(repositoryClass: AssignmentRepository::class)]
class Assignment
{
    /** Completed work is deleted this many days after the teacher completed it. */
    public const int DAYS_UNTIL_DELETION = 30;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Student::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Student $student;

    /** No ON DELETE CASCADE: a Material that an Assignment uses cannot be deleted. */
    #[ORM\ManyToOne(targetEntity: Material::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Material $material;

    /** For this student only. Optional. */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $personalInstruction;

    /** How the parent can help, without music terms. Optional. */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $parentHint;

    #[ORM\Column(length: 20, enumType: AssignmentStatus::class)]
    private AssignmentStatus $status = AssignmentStatus::Active;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    /** completedAt + 30 days. The daily deletion job reads this field (roadmap phase 5). */
    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $deleteAt = null;

    /**
     * The number of lifecycle changes: every method below that changes the Assignment, its Submission or its Feedback
     * raises it. The value itself is not used. Its purpose: Doctrine then has to UPDATE the row of the Assignment,
     * also when only a Recording row changed, and every UPDATE of this row checks the version below.
     */
    #[ORM\Column]
    private int $revision = 0;

    /**
     * Optimistic locking. Doctrine adds "AND version = <the version it read>" to every UPDATE of this row and
     * raises the number. If another request changed the Assignment in the meantime, the UPDATE finds no row and
     * Doctrine throws OptimisticLockException.
     * Example: the parent sends a recording at the moment the teacher completes the Assignment.
     * This covers two requests at the same moment. For "the teacher looked at an older state" the review
     * also sends the version that the screen had (Assignments::review).
     *
     * https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/transactions-and-concurrency.html#optimistic-locking
     */
    #[ORM\Version]
    #[ORM\Column(type: Types::INTEGER)]
    private int $version = 1;

    /** Created with the first recording. cascade persist: saving the Assignment saves a new Submission too. */
    #[ORM\OneToOne(targetEntity: Submission::class, mappedBy: 'assignment', cascade: ['persist'])]
    private ?Submission $submission = null;

    /** The latest text of the teacher. A new review replaces it. */
    #[ORM\OneToOne(targetEntity: Feedback::class, mappedBy: 'assignment', cascade: ['persist'])]
    private ?Feedback $feedback = null;

    public function __construct(Student $student, Material $material, ?string $personalInstruction, ?string $parentHint, \DateTimeImmutable $now)
    {
        if (!$student->isTaughtBy($material->getTeacher())) {
            throw new \LogicException('The student and the material belong to different teachers.');
        }

        $this->student = $student;
        $this->material = $material;
        $this->personalInstruction = $personalInstruction;
        $this->parentHint = $parentHint;
        $this->createdAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStudent(): Student
    {
        return $this->student;
    }

    public function getMaterial(): Material
    {
        return $this->material;
    }

    public function getPersonalInstruction(): ?string
    {
        return $this->personalInstruction;
    }

    public function getParentHint(): ?string
    {
        return $this->parentHint;
    }

    public function getStatus(): AssignmentStatus
    {
        return $this->status;
    }

    public function isCompleted(): bool
    {
        return AssignmentStatus::Completed === $this->status;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getDeleteAt(): ?\DateTimeImmutable
    {
        return $this->deleteAt;
    }

    public function getVersion(): int
    {
        return $this->version;
    }

    public function getSubmission(): ?Submission
    {
        return $this->submission;
    }

    public function getFeedback(): ?Feedback
    {
        return $this->feedback;
    }

    /** The status on the piece card, from the two status fields (docs/tech/data-model.md, "Status fields"). */
    public function getPieceStatus(): PieceStatus
    {
        if ($this->isCompleted()) {
            return PieceStatus::Completed;
        }

        return match ($this->submission?->getStatus()) {
            null => PieceStatus::InProgress,
            SubmissionStatus::PendingReview => PieceStatus::Sent,
            SubmissionStatus::Reviewed => PieceStatus::TryAgain,
        };
    }

    /** True while a recording waits for the teacher. */
    public function isWaitingForReview(): bool
    {
        return PieceStatus::Sent === $this->getPieceStatus();
    }

    /**
     * The feedback was written before the latest recording, so it is "advice for the previous attempt"
     * (docs/product/assignment-lifecycle.md, "Replacing a recording").
     */
    public function hasFeedbackForPreviousAttempt(): bool
    {
        return null !== $this->feedback && $this->isWaitingForReview();
    }

    public function canReceiveRecording(): bool
    {
        return !$this->isCompleted();
    }

    /**
     * Saves a new recording and sets the status "Sent".
     *
     * @return string|null the storage key of the recording that was replaced: the caller deletes that object
     */
    public function submitRecording(RecordingKind $kind, StoredObject $file, \DateTimeImmutable $now): ?string
    {
        if (!$this->canReceiveRecording()) {
            throw new \LogicException('A completed assignment takes no new recordings.');
        }

        ++$this->revision;
        $this->submission ??= new Submission($this, $now);

        return $this->submission->replaceRecording($kind, $file, $now);
    }

    /** "Ask to try again": saves the feedback; the status becomes "Try again". */
    public function askToTryAgain(string $feedback, \DateTimeImmutable $now): void
    {
        $submission = $this->submission;
        if (!$this->isWaitingForReview() || null === $submission) {
            throw new \LogicException('There is no new recording to review.');
        }

        ++$this->revision;
        $this->saveFeedback($feedback, $now);
        $submission->markReviewed();
    }

    /** "Complete": saves the feedback and starts the 30 days until deletion. */
    public function complete(string $feedback, \DateTimeImmutable $now): void
    {
        if ($this->isCompleted()) {
            throw new \LogicException('This assignment is already completed.');
        }

        ++$this->revision;
        $this->saveFeedback($feedback, $now);
        $this->submission?->markReviewed();
        $this->status = AssignmentStatus::Completed;
        $this->completedAt = $now;
        $this->deleteAt = $now->modify(\sprintf('+%d days', self::DAYS_UNTIL_DELETION));
    }

    private function saveFeedback(string $text, \DateTimeImmutable $now): void
    {
        if (null === $this->feedback) {
            $this->feedback = new Feedback($this, $text, $now);

            return;
        }

        $this->feedback->replace($text, $now);
    }
}
