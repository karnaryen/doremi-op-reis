<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * The current recordings of an Assignment: at most one video and one audio.
 * The row is created with the first upload, so there is no "not submitted" status.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(name: 'uniq_submission_assignment', columns: ['assignment_id'])]
class Submission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Assignment::class, inversedBy: 'submission')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Assignment $assignment;

    #[ORM\Column(length: 20, enumType: SubmissionStatus::class)]
    private SubmissionStatus $status = SubmissionStatus::PendingReview;

    /** When the latest recording came in. The "To review" tab shows the oldest first. */
    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    private \DateTimeImmutable $submittedAt;

    /** @var Collection<int, Recording> */
    #[ORM\OneToMany(targetEntity: Recording::class, mappedBy: 'submission', cascade: ['persist'])]
    private Collection $recordings;

    public function __construct(Assignment $assignment, \DateTimeImmutable $now)
    {
        $this->assignment = $assignment;
        $this->submittedAt = $now;
        $this->recordings = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAssignment(): Assignment
    {
        return $this->assignment;
    }

    public function getStatus(): SubmissionStatus
    {
        return $this->status;
    }

    public function getSubmittedAt(): \DateTimeImmutable
    {
        return $this->submittedAt;
    }

    /** @return list<Recording> */
    public function getRecordings(): array
    {
        return array_values($this->recordings->toArray());
    }

    public function getRecording(RecordingKind $kind): ?Recording
    {
        foreach ($this->recordings as $recording) {
            if ($recording->getKind() === $kind) {
                return $recording;
            }
        }

        return null;
    }

    /**
     * A new recording replaces the old one of the same kind; the other kind is not changed.
     * The row of the old recording is reused, so the rule UNIQUE (submission_id, kind) always holds.
     *
     * @return string|null the storage key of the replaced recording
     */
    public function replaceRecording(RecordingKind $kind, StoredObject $file, \DateTimeImmutable $now): ?string
    {
        $this->status = SubmissionStatus::PendingReview;
        $this->submittedAt = $now;

        $existing = $this->getRecording($kind);
        if (null === $existing) {
            $this->recordings->add(new Recording($this, $kind, $file));

            return null;
        }

        return $existing->replaceFile($file);
    }

    public function markReviewed(): void
    {
        $this->status = SubmissionStatus::Reviewed;
    }
}
