<?php

declare(strict_types=1);

namespace App\Entity;

/**
 * The two kinds of accounts (docs/product/users.md). A guest has no account.
 *
 * A "backed" enum: every case has a string value, and this value is saved in the database.
 */
enum UserRole: string
{
    case Teacher = 'teacher';
    case Parent = 'parent';

    /** The role name that Symfony Security checks, for example in #[IsGranted('ROLE_TEACHER')]. */
    public function securityRole(): string
    {
        return match ($this) {
            self::Teacher => 'ROLE_TEACHER',
            self::Parent => 'ROLE_PARENT',
        };
    }
}
