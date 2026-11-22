<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Exception\RuleViolation;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Clock\ClockInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Invitation tokens (docs/tech/architecture.md, "Parent invitation flow").
 *
 * The token is a long random text. The email has the token; the database has only its SHA-256 hash.
 * So a person who can read the database cannot use the open invitations.
 * A plain hash without salt is enough here: the token has 256 random bits, nobody can guess it.
 * (A password needs a slow, salted hash, because people choose short passwords.)
 */
final readonly class Invitations
{
    public const int VALID_DAYS = 7;

    public function __construct(
        private UserRepository $users,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ClockInterface $clock,
    ) {
    }

    /**
     * Gives the parent a new token; an older one stops working. The caller saves the change (flush).
     *
     * @return string the token for the email
     */
    public function issue(User $parent): string
    {
        $token = bin2hex(random_bytes(32));
        $parent->invite(self::hash($token), $this->clock->now()->modify(\sprintf('+%d days', self::VALID_DAYS)));

        return $token;
    }

    /**
     * The parent sets a password. The token works once.
     *
     * @throws RuleViolation the token is unknown, used or expired
     */
    public function accept(#[\SensitiveParameter] string $token, #[\SensitiveParameter] string $password): User
    {
        $parent = $this->users->findOneByInvitationTokenHash(self::hash($token));
        if (null === $parent || !$parent->hasValidInvitation($this->clock->now())) {
            // One answer for "unknown" and "expired": the answer does not say if a token ever existed.
            throw RuleViolation::invitationInvalid();
        }

        $parent->acceptInvitation($this->passwordHasher->hashPassword($parent, $password));
        $this->entityManager->flush();

        return $parent;
    }

    private static function hash(#[\SensitiveParameter] string $token): string
    {
        return hash('sha256', $token);
    }
}
