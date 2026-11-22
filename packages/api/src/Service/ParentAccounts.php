<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\AddParentRequest;
use App\Entity\Student;
use App\Entity\User;
use App\Exception\RuleViolation;
use App\Repository\AssignmentRepository;
use App\Repository\StudentRepository;
use App\Repository\UserRepository;
use App\Upload\Uploads;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Clock\ClockInterface;

/**
 * The parent accounts of a teacher: add, invite again, delete (docs/product/users.md, "Account rules").
 * The controller has already checked that the parent belongs to the teacher (ParentAccountVoter).
 */
final readonly class ParentAccounts
{
    public function __construct(
        private UserRepository $users,
        private StudentRepository $students,
        private AssignmentRepository $assignments,
        private EntityManagerInterface $entityManager,
        private Invitations $invitations,
        private InvitationMailer $mailer,
        private Uploads $uploads,
        private ClockInterface $clock,
    ) {
    }

    /**
     * Creates the parent, the child and the invitation token in one transaction, then sends the email.
     *
     * One flush() is one database transaction: Doctrine sends all INSERTs together, and if one fails
     * (the student cannot be saved) the others are rolled back. So the parent is never saved without the child.
     *
     * The email is sent only after the transaction: if saving fails, nobody gets a link that does not work.
     * If the email fails, the account stays and the teacher sends the invitation again.
     *
     * @throws RuleViolation the email is taken
     */
    public function add(User $teacher, AddParentRequest $request): InvitedParent
    {
        if (null !== $this->users->findOneByEmail($request->email)) {
            throw RuleViolation::emailAlreadyUsed();
        }

        $now = $this->clock->now();
        $parent = User::parentOf($teacher, trim($request->name), $request->email, $now);
        $student = new Student($parent, trim($request->childName), $now);
        $token = $this->invitations->issue($parent);

        try {
            $this->entityManager->persist($parent);
            $this->entityManager->persist($student);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            // Two requests with one email at the same moment: the unique index stops the second one.
            throw RuleViolation::emailAlreadyUsed();
        }

        return new InvitedParent($student, $this->mailer->send($parent, $teacher, $token));
    }

    /**
     * Replaces the token and sends a new email.
     *
     * @throws RuleViolation the parent has already set a password
     */
    public function inviteAgain(User $teacher, User $parent): InvitedParent
    {
        if ($parent->hasPassword()) {
            throw RuleViolation::passwordAlreadySet();
        }

        $student = $this->students->findOneByParent($parent);
        if (null === $student) {
            throw new \LogicException('A parent account always has a student: both are created together.');
        }

        $token = $this->invitations->issue($parent);
        $this->entityManager->flush();

        return new InvitedParent($student, $this->mailer->send($parent, $teacher, $token));
    }

    /**
     * Deletes the parent account with the child, the Assignments, the recordings and the feedback.
     * The Materials of the teacher stay (docs/tech/architecture.md, "Parent deletion flow").
     *
     * PostgreSQL and R2 have no common transaction. The order is: the database first, then the files.
     * If a file cannot be deleted, it has no row any more and nobody can open it;
     * the daily job removes such objects (roadmap phase 5). The other order would be worse:
     * rows that point to files that do not exist.
     */
    public function delete(User $parent): void
    {
        // Read both lists first: the database deletes the rows of the family together with the parent.
        $recordingKeys = $this->assignments->findRecordingKeysOfParent($parent);
        $uploadPrefixes = array_map(RecordingUploads::temporaryPrefixOf(...), $this->assignments->findIdsOfParent($parent));

        // One DELETE; the foreign keys with ON DELETE CASCADE delete the rows of the family.
        $this->entityManager->remove($parent);
        $this->entityManager->flush();

        $this->uploads->discard(...$recordingKeys);
        // Also the uploads that were never confirmed: a video of the child that has no database row.
        $this->uploads->discardPrefix(...$uploadPrefixes);
    }
}
