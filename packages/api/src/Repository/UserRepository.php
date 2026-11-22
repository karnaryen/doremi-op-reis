<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Security\User\UserLoaderInterface;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * Queries for users. A repository is the place for "find ..." methods; it has no business rules.
 *
 * UserLoaderInterface: Symfony Security calls loadUserByIdentifier() at sign-in (config/packages/security.yaml).
 *
 * @extends ServiceEntityRepository<User>
 */
final class UserRepository extends ServiceEntityRepository implements UserLoaderInterface, PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Lower case, but not trimmed: " anna@example.com" is not an account. The limiter of failed sign-ins counts
     * per typed email. If spaces were ignored here, every variant with spaces would get its own five tries
     * for the same account. The sign-in form removes the spaces before it sends the email.
     */
    public function loadUserByIdentifier(string $identifier): ?User
    {
        return $this->findOneBy(['email' => mb_strtolower($identifier)]);
    }

    public function findOneByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => User::normalizeEmail($email)]);
    }

    public function findOneByInvitationTokenHash(string $tokenHash): ?User
    {
        return $this->findOneBy(['invitationTokenHash' => $tokenHash]);
    }

    /**
     * Symfony calls this after a sign-in if the saved hash uses an older algorithm or cost:
     * the password is hashed again with the current settings.
     *
     * https://symfony.com/doc/current/security/passwords.html#password-migration
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, #[\SensitiveParameter] string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(\sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPasswordHash($newHashedPassword);
        $this->getEntityManager()->flush();
    }
}
