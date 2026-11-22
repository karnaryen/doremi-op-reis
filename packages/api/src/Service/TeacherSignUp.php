<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\SignUpRequest;
use App\Entity\User;
use App\Exception\RuleViolation;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Clock\ClockInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** Creates a teacher account (docs/product/users.md, "Account rules"). */
final readonly class TeacherSignUp
{
    public function __construct(
        private UserRepository $users,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ClockInterface $clock,
    ) {
    }

    /** @throws RuleViolation the email is taken */
    public function signUp(SignUpRequest $request): User
    {
        if (null !== $this->users->findOneByEmail($request->email)) {
            throw RuleViolation::emailAlreadyUsed();
        }

        $teacher = User::teacher(trim($request->name), $request->email, $this->clock->now());
        $teacher->setPasswordHash($this->passwordHasher->hashPassword($teacher, $request->password));

        try {
            $this->entityManager->persist($teacher);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            // Two sign-ups with one email at the same moment: both pass the check above,
            // and the unique index of the database stops the second one.
            throw RuleViolation::emailAlreadyUsed();
        }

        return $teacher;
    }
}
