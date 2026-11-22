<?php

declare(strict_types=1);

namespace App\View;

use App\Entity\Student;
use App\Entity\User;
use App\Entity\UserRole;

/** JSON answer: the signed-in user. */
final readonly class ProfileView
{
    private function __construct(
        public int $id,
        public string $name,
        public string $email,
        public UserRole $role,
        /** For a parent: the name of the child. Null for a teacher. */
        public ?string $childName,
    ) {
    }

    public static function of(User $user, ?Student $child): self
    {
        return new self((int) $user->getId(), $user->getName(), $user->getEmail(), $user->getRole(), $child?->getName());
    }
}
