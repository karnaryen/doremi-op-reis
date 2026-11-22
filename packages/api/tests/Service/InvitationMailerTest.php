<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\User;
use App\Service\InvitationMailer;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class InvitationMailerTest extends TestCase
{
    public function testTheEmailHasTheLinkWithTheTokenInTheFragment(): void
    {
        $sent = null;
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::once())->method('send')->willReturnCallback(static function (Email $email) use (&$sent): void {
            $sent = $email;
        });

        $result = $this->mailer($mailer)->send(...$this->parentAndTeacher(), token: 'abc123');

        self::assertTrue($result);
        self::assertInstanceOf(Email::class, $sent);
        self::assertSame('paula@example.test', $sent->getTo()[0]->getAddress());
        self::assertSame('no-reply@example.test', $sent->getFrom()[0]->getAddress());
        // The base URL has a slash at the end: the link must not get two.
        self::assertStringContainsString('https://app.example.test/set-password#token=abc123', (string) $sent->getTextBody());
        self::assertStringContainsString('Tessa nodigt je uit', (string) $sent->getTextBody());
        self::assertStringContainsString('Tessa invites you', (string) $sent->getTextBody());
    }

    public function testAFailedEmailIsReportedAndNotThrown(): void
    {
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('send')->willThrowException(new TransportException('Connection refused'));

        // The parent account is already saved: the teacher can send the invitation again.
        self::assertFalse($this->mailer($mailer)->send(...$this->parentAndTeacher(), token: 'abc123'));
    }

    private function mailer(MailerInterface $mailer): InvitationMailer
    {
        return new InvitationMailer($mailer, new NullLogger(), 'https://app.example.test/', 'Doremi op reis <no-reply@example.test>');
    }

    /** @return array{parent: User, teacher: User} */
    private function parentAndTeacher(): array
    {
        $now = new \DateTimeImmutable('2026-11-22 10:00:00');
        $teacher = User::teacher('Tessa', 'tessa@example.test', $now);

        return ['parent' => User::parentOf($teacher, 'Paula', 'paula@example.test', $now), 'teacher' => $teacher];
    }
}
