<?php

declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    private \DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->now = new \DateTimeImmutable('2026-11-22 10:00:00');
    }

    public function testTheEmailIsSavedInLowerCaseWithoutSpaces(): void
    {
        self::assertSame('anna@example.test', User::teacher('Anna', '  Anna@Example.TEST ', $this->now)->getEmail());
    }

    public function testATeacherHasTheTeacherRole(): void
    {
        self::assertSame(['ROLE_TEACHER', 'ROLE_USER'], User::teacher('Anna', 'anna@example.test', $this->now)->getRoles());
    }

    public function testAParentBelongsToTheTeacherAndHasNoPassword(): void
    {
        $teacher = User::teacher('Anna', 'anna@example.test', $this->now);
        $parent = User::parentOf($teacher, 'Paula', 'paula@example.test', $this->now);

        self::assertSame(['ROLE_PARENT', 'ROLE_USER'], $parent->getRoles());
        self::assertSame($teacher, $parent->getTeacher());
        self::assertFalse($parent->hasPassword());
        self::assertNull($parent->getPassword());
    }

    public function testOnlyATeacherCanHaveParents(): void
    {
        $teacher = User::teacher('Anna', 'anna@example.test', $this->now);
        $parent = User::parentOf($teacher, 'Paula', 'paula@example.test', $this->now);

        $this->expectException(\LogicException::class);

        User::parentOf($parent, 'Peter', 'peter@example.test', $this->now);
    }

    public function testAnInvitationIsValidUntilItExpires(): void
    {
        $parent = User::parentOf(User::teacher('Anna', 'anna@example.test', $this->now), 'Paula', 'paula@example.test', $this->now);
        $parent->invite(str_repeat('a', 64), $this->now->modify('+7 days'));

        self::assertTrue($parent->hasValidInvitation($this->now->modify('+7 days -1 second')));
        self::assertFalse($parent->hasValidInvitation($this->now->modify('+7 days')));
    }

    public function testAnAcceptedInvitationCannotBeUsedAgain(): void
    {
        $parent = User::parentOf(User::teacher('Anna', 'anna@example.test', $this->now), 'Paula', 'paula@example.test', $this->now);
        $parent->invite(str_repeat('a', 64), $this->now->modify('+7 days'));

        $parent->acceptInvitation('hash');

        self::assertTrue($parent->hasPassword());
        self::assertFalse($parent->hasValidInvitation($this->now));
    }

    public function testTheSessionGetsAChecksumAndNotThePasswordHash(): void
    {
        $teacher = User::teacher('Anna', 'anna@example.test', $this->now);
        $teacher->setPasswordHash('$2y$13$the-real-password-hash');

        $serialized = serialize($teacher);

        self::assertStringNotContainsString('the-real-password-hash', $serialized);
        $restored = unserialize($serialized);
        self::assertInstanceOf(User::class, $restored);
        self::assertSame('anna@example.test', $restored->getUserIdentifier());
        self::assertSame(['ROLE_TEACHER', 'ROLE_USER'], $restored->getRoles());
        // Symfony compares this checksum with the hash in the database at every request.
        self::assertSame(hash('crc32c', '$2y$13$the-real-password-hash'), $restored->getPassword());
    }
}
