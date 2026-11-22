<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * A teacher manages (invites again, deletes) only the parent accounts that they created.
 * The subject is the parent account; the signed-in user is the teacher.
 *
 * @extends Voter<string, User>
 */
final class ParentAccountVoter extends Voter
{
    public const string MANAGE = 'PARENT_MANAGE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::MANAGE === $attribute && $subject instanceof User;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        return $user instanceof User && $user->isTeacher() && $subject->isParentOfTeacher($user);
    }
}
