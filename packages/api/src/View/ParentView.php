<?php

declare(strict_types=1);

namespace App\View;

use App\Entity\User;

/** JSON answer: a parent account, as the teacher sees it. */
final readonly class ParentView
{
    private function __construct(
        public int $id,
        public string $name,
        public string $email,
        /** True until the parent has set a password. */
        public bool $invitationPending,
    ) {
    }

    public static function of(User $parent): self
    {
        return new self((int) $parent->getId(), $parent->getName(), $parent->getEmail(), !$parent->hasPassword());
    }
}
