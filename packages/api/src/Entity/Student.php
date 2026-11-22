<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\StudentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A child. Children have no account: the parent uses the app for them.
 *
 * In the MVP one parent has one child. The unique constraint on parent_id keeps this rule in the database.
 * Deleting the parent deletes the student (ON DELETE CASCADE).
 */
#[ORM\Entity(repositoryClass: StudentRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_student_parent', columns: ['parent_id'])]
class Student
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $parent;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(User $parent, string $name, \DateTimeImmutable $now)
    {
        if (!$parent->isParent()) {
            throw new \LogicException('A student belongs to a parent account.');
        }

        $this->parent = $parent;
        $this->name = $name;
        $this->createdAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getParent(): User
    {
        return $this->parent;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /** The access rule: a teacher sees a student only if the parent is their own. */
    public function isTaughtBy(User $teacher): bool
    {
        return $this->parent->isParentOfTeacher($teacher);
    }

    public function isChildOf(User $parent): bool
    {
        return $this->parent->getId() === $parent->getId();
    }
}
