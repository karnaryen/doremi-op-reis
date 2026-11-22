<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Student;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * A teacher opens a student only if the parent of the student is their own.
 *
 * @extends Voter<string, Student>
 */
final class StudentVoter extends Voter
{
    public const string VIEW = 'STUDENT_VIEW';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::VIEW === $attribute && $subject instanceof Student;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        return $user instanceof User && $user->isTeacher() && $subject->isTaughtBy($user);
    }
}
