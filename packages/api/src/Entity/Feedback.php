<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * The latest text of the teacher on an Assignment. It is one text, not a chat: a new review replaces it.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(name: 'uniq_feedback_assignment', columns: ['assignment_id'])]
class Feedback
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Assignment::class, inversedBy: 'feedback')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Assignment $assignment;

    #[ORM\Column(type: Types::TEXT)]
    private string $text;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function __construct(Assignment $assignment, string $text, \DateTimeImmutable $now)
    {
        $this->assignment = $assignment;
        $this->text = $text;
        $this->updatedAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAssignment(): Assignment
    {
        return $this->assignment;
    }

    public function getText(): string
    {
        return $this->text;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function replace(string $text, \DateTimeImmutable $now): void
    {
        $this->text = $text;
        $this->updatedAt = $now;
    }
}
