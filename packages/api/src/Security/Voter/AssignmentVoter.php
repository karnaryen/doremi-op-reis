<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Assignment;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Who may do what with one Assignment (docs/product/users.md, "Access rule").
 *
 * A role check is not enough: every teacher has ROLE_TEACHER, but a teacher may only open the Assignments
 * of their own students. A voter answers the question for one object.
 * Use: #[IsGranted(AssignmentVoter::VIEW, 'assignment')] on a controller method.
 *
 * https://symfony.com/doc/current/security/voters.html
 *
 * @extends Voter<string, Assignment>
 */
final class AssignmentVoter extends Voter
{
    /** The teacher of the student and the parent of the student. */
    public const string VIEW = 'ASSIGNMENT_VIEW';
    /** Only the parent uploads recordings. */
    public const string UPLOAD = 'ASSIGNMENT_UPLOAD';
    /** Only the teacher of the student reviews and completes. */
    public const string REVIEW = 'ASSIGNMENT_REVIEW';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return \in_array($attribute, [self::VIEW, self::UPLOAD, self::REVIEW], true) && $subject instanceof Assignment;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $student = $subject->getStudent();
        $isTeacher = $user->isTeacher() && $student->isTaughtBy($user);
        $isParent = $user->isParent() && $student->isChildOf($user);

        return match ($attribute) {
            self::VIEW => $isTeacher || $isParent,
            self::UPLOAD => $isParent,
            self::REVIEW => $isTeacher,
            default => false,
        };
    }
}
