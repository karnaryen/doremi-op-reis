<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * A teacher or a parent (docs/tech/data-model.md).
 *
 * The two interfaces tell Symfony Security how to find the name of the user (the email)
 * and where the password hash is.
 *
 * A parent has a teacher: the teacher who made the account. Until the parent sets a password,
 * the row keeps the hash of an invitation token and the date when the token stops working.
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
// "user" is a reserved word in PostgreSQL, so the table has another name.
#[ORM\Table(name: 'app_user')]
#[ORM\UniqueConstraint(name: 'uniq_user_email', columns: ['email'])]
#[ORM\UniqueConstraint(name: 'uniq_user_invitation_token_hash', columns: ['invitation_token_hash'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name;

    /** Always lower case, so "Anna@Example.com" and "anna@example.com" are one account. */
    #[ORM\Column(length: 180)]
    private string $email;

    /** Null until the parent accepts the invitation. A user without a password cannot sign in. */
    #[ORM\Column(name: 'password_hash', length: 255, nullable: true)]
    private ?string $passwordHash = null;

    #[ORM\Column(length: 20, enumType: UserRole::class)]
    private UserRole $role;

    /** Only for a parent: the teacher who made the account. */
    #[ORM\ManyToOne(targetEntity: self::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $teacher = null;

    /** SHA-256 of the invitation token. The token itself is only in the email. */
    #[ORM\Column(length: 64, nullable: true)]
    private ?string $invitationTokenHash = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $invitationExpiresAt = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    private function __construct(string $name, string $email, UserRole $role, \DateTimeImmutable $now)
    {
        $this->name = $name;
        $this->email = self::normalizeEmail($email);
        $this->role = $role;
        $this->createdAt = $now;
    }

    public static function teacher(string $name, string $email, \DateTimeImmutable $now): self
    {
        return new self($name, $email, UserRole::Teacher, $now);
    }

    /** A parent account without a password. Call invite() to let the parent set one. */
    public static function parentOf(self $teacher, string $name, string $email, \DateTimeImmutable $now): self
    {
        if (!$teacher->isTeacher()) {
            throw new \LogicException('Only a teacher can have parents.');
        }

        $parent = new self($name, $email, UserRole::Parent, $now);
        $parent->teacher = $teacher;

        return $parent;
    }

    public static function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getRole(): UserRole
    {
        return $this->role;
    }

    public function isTeacher(): bool
    {
        return UserRole::Teacher === $this->role;
    }

    public function isParent(): bool
    {
        return UserRole::Parent === $this->role;
    }

    public function getTeacher(): ?self
    {
        return $this->teacher;
    }

    /** The access rule for a parent account: it belongs to the teacher who made it. */
    public function isParentOfTeacher(self $teacher): bool
    {
        return $this->isParent() && null !== $this->teacher && $this->teacher->getId() === $teacher->getId();
    }

    public function setPasswordHash(#[\SensitiveParameter] string $passwordHash): void
    {
        $this->passwordHash = $passwordHash;
    }

    public function hasPassword(): bool
    {
        return null !== $this->passwordHash;
    }

    /** Saves the hash of a new invitation token. An older token stops working. */
    public function invite(string $tokenHash, \DateTimeImmutable $expiresAt): void
    {
        if ($this->hasPassword()) {
            throw new \LogicException('This user already has a password.');
        }

        $this->invitationTokenHash = $tokenHash;
        $this->invitationExpiresAt = $expiresAt;
    }

    public function hasValidInvitation(\DateTimeImmutable $now): bool
    {
        return null !== $this->invitationTokenHash
            && null !== $this->invitationExpiresAt
            && $this->invitationExpiresAt > $now;
    }

    /** The parent has set a password: the token is used and cannot be used again. */
    public function acceptInvitation(#[\SensitiveParameter] string $passwordHash): void
    {
        $this->passwordHash = $passwordHash;
        $this->invitationTokenHash = null;
        $this->invitationExpiresAt = null;
    }

    // --- Symfony Security ---

    /** The value that identifies the user at sign-in and in the session. */
    public function getUserIdentifier(): string
    {
        \assert('' !== $this->email);

        return $this->email;
    }

    /** @return list<string> */
    public function getRoles(): array
    {
        return [$this->role->securityRole(), 'ROLE_USER'];
    }

    public function getPassword(): ?string
    {
        return $this->passwordHash;
    }

    /**
     * Symfony saves the user in the session, and reads it from the database again at every request.
     * Only the fields below go into the session. The password hash itself does not: a checksum of it
     * is enough for Symfony to notice a changed password and to end the old sessions.
     *
     * https://symfony.com/doc/current/security.html#understanding-how-users-are-refreshed-from-the-session
     *
     * @return array{id: int|null, email: string, role: string, password: string|null}
     */
    public function __serialize(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role->value,
            'password' => null === $this->passwordHash ? null : hash('crc32c', $this->passwordHash),
        ];
    }

    /** @param array<array-key, mixed> $data */
    public function __unserialize(array $data): void
    {
        $id = $data['id'] ?? null;
        $email = $data['email'] ?? null;
        $role = $data['role'] ?? null;
        $password = $data['password'] ?? null;

        $this->id = \is_int($id) ? $id : null;
        $this->email = \is_string($email) ? $email : '';
        $this->role = UserRole::from(\is_string($role) ? $role : '');
        $this->passwordHash = \is_string($password) ? $password : null;
    }
}
