<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Material;
use App\Entity\RecordingKind;
use App\Entity\Student;
use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\Mime\Email;

/** The teacher adds, invites and deletes parents; the parent accepts the invitation. */
final class ParentAccountTest extends ApiTestCase
{
    public function testATeacherAddsAParentWithAChildAndTheParentGetsAnEmail(): void
    {
        $teacher = $this->createTeacher();
        $this->client->loginUser($teacher);

        $this->post('/api/parents', ['name' => 'Paula Parent', 'email' => 'Paula@Example.test', 'childName' => 'Charlie']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Charlie', $this->json('name'));
        self::assertSame('Paula Parent', $this->json('parent.name'));
        self::assertSame('paula@example.test', $this->json('parent.email'));
        self::assertTrue($this->json('parent.invitationPending'));
        self::assertTrue($this->json('invitationSent'));

        self::assertEmailCount(1);
        $email = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $email);
        self::assertEmailAddressContains($email, 'To', 'paula@example.test');
        self::assertMatchesRegularExpression('~https://app\.example\.test/set-password#token=[0-9a-f]{64}\b~', (string) $email->getTextBody());

        $parent = static::getContainer()->get(UserRepository::class)->findOneByEmail('paula@example.test');
        self::assertInstanceOf(User::class, $parent);
        self::assertTrue($parent->isParentOfTeacher($teacher));
        self::assertFalse($parent->hasPassword());
    }

    public function testTheDatabaseHasOnlyAHashOfTheInvitationToken(): void
    {
        $this->client->loginUser($this->createTeacher());
        $token = $this->addParentAndReadToken();

        $hash = $this->entityManager()->getConnection()->fetchOne('SELECT invitation_token_hash FROM app_user WHERE email = ?', ['paula@example.test']);

        self::assertSame(hash('sha256', $token), $hash);
    }

    public function testAnEmailCanHaveOnlyOneAccount(): void
    {
        $teacher = $this->createTeacher('tessa@example.test');
        $this->client->loginUser($teacher);

        $this->post('/api/parents', ['name' => 'Paula', 'email' => 'tessa@example.test', 'childName' => 'Charlie']);

        $this->assertError(409, 'email_already_used');
        self::assertEmailCount(0);
    }

    public function testANameCannotBeALinkOrAnAdvertisement(): void
    {
        $this->client->loginUser($this->createTeacher());

        // The name is printed in the invitation email, which goes to any address the teacher types.
        $this->post('/api/parents', ['name' => 'Win a prize: http://evil.example', 'email' => 'victim@example.test', 'childName' => 'Charlie']);
        $this->assertError(422, 'validation_failed');
        self::assertSame('name', $this->json('violations.0.field'));

        $this->post('/api/parents', ['name' => 'Paula', 'email' => 'victim@example.test', 'childName' => 'evil.example']);
        $this->assertError(422, 'validation_failed');

        self::assertEmailCount(0);

        // Real names pass.
        $this->post('/api/parents', ['name' => "J. de Vries-O'Brien", 'email' => 'parent@example.test', 'childName' => 'Zoë Anne-Marie']);
        self::assertResponseStatusCodeSame(201);
    }

    public function testInvitationEmailsAreLimitedPerTeacher(): void
    {
        $this->client->loginUser($this->createTeacher());

        for ($i = 1; $i <= 30; ++$i) {
            $this->post('/api/parents', ['name' => 'Paula Parent', 'email' => "parent$i@example.test", 'childName' => 'Charlie']);
            self::assertResponseStatusCodeSame(201);
        }

        $this->post('/api/parents', ['name' => 'Paula Parent', 'email' => 'parent31@example.test', 'childName' => 'Charlie']);

        $this->assertError(429, 'too_many_requests');
        self::assertEmailCount(0);
        self::assertNull(static::getContainer()->get(UserRepository::class)->findOneByEmail('parent31@example.test'));
    }

    public function testOnlyATeacherAddsParents(): void
    {
        $body = ['name' => 'Paula', 'email' => 'new@example.test', 'childName' => 'Charlie'];

        $this->post('/api/parents', $body);
        $this->assertError(401, 'unauthorized');

        $this->client->loginUser($this->createStudent($this->createTeacher())->getParent());
        $this->post('/api/parents', $body);
        $this->assertError(403, 'forbidden');
    }

    public function testTheParentSetsAPasswordAndIsSignedIn(): void
    {
        $this->client->loginUser($this->createTeacher());
        $token = $this->addParentAndReadToken();
        $this->post('/api/logout');

        $this->post('/api/invitations/accept', ['token' => $token, 'password' => 'a new long password']);

        self::assertResponseIsSuccessful();
        self::assertSame('parent', $this->json('role'));
        self::assertSame('Charlie', $this->json('childName'));
        $this->get('/api/profile');
        self::assertResponseIsSuccessful();

        // And the password works at the next sign-in.
        $this->post('/api/logout');
        $this->post('/api/login', ['email' => 'paula@example.test', 'password' => 'a new long password']);
        self::assertResponseIsSuccessful();
    }

    public function testAnInvitationWorksOnce(): void
    {
        $this->client->loginUser($this->createTeacher());
        $token = $this->addParentAndReadToken();
        $this->post('/api/logout');
        $this->post('/api/invitations/accept', ['token' => $token, 'password' => 'a new long password']);
        self::assertResponseIsSuccessful();
        $this->post('/api/logout');

        $this->post('/api/invitations/accept', ['token' => $token, 'password' => 'the password of a thief']);

        $this->assertError(422, 'invitation_invalid');
    }

    public function testAnInvitationExpiresAfterSevenDays(): void
    {
        $this->client->loginUser($this->createTeacher());
        $token = $this->addParentAndReadToken();
        $this->post('/api/logout');

        self::mockTime(new \DateTimeImmutable(self::NOW)->modify('+7 days +1 second'));
        $this->post('/api/invitations/accept', ['token' => $token, 'password' => 'a new long password']);

        $this->assertError(422, 'invitation_invalid');
    }

    public function testAnUnknownTokenAndAShortPasswordAreRefused(): void
    {
        $this->post('/api/invitations/accept', ['token' => str_repeat('0', 64), 'password' => 'a new long password']);
        $this->assertError(422, 'invitation_invalid');

        $this->post('/api/invitations/accept', ['token' => 'abc', 'password' => 'short']);
        $this->assertError(422, 'validation_failed');
    }

    public function testAParentWithoutAPasswordCannotSignIn(): void
    {
        $this->client->loginUser($this->createTeacher());
        $this->addParentAndReadToken();
        $this->post('/api/logout');

        $this->post('/api/login', ['email' => 'paula@example.test', 'password' => '']);
        self::assertResponseStatusCodeSame(401);

        $this->post('/api/login', ['email' => 'paula@example.test', 'password' => 'anything at all']);
        $this->assertError(401, 'invalid_credentials');
    }

    public function testInviteAgainReplacesTheToken(): void
    {
        $this->client->loginUser($this->createTeacher());
        $oldToken = $this->addParentAndReadToken();
        $parentId = $this->jsonInt('parent.id');

        $this->post("/api/parents/$parentId/invitation");

        self::assertResponseIsSuccessful();
        self::assertTrue($this->json('invitationSent'));
        $newToken = $this->tokenFromEmail();
        self::assertNotSame($oldToken, $newToken);

        $this->post('/api/logout');
        $this->post('/api/invitations/accept', ['token' => $oldToken, 'password' => 'a new long password']);
        $this->assertError(422, 'invitation_invalid');
        $this->post('/api/invitations/accept', ['token' => $newToken, 'password' => 'a new long password']);
        self::assertResponseIsSuccessful();
    }

    public function testNoNewInvitationForAParentWithAPassword(): void
    {
        $teacher = $this->createTeacher();
        $parent = $this->createStudent($teacher)->getParent();
        $this->client->loginUser($teacher);

        $this->post("/api/parents/{$parent->getId()}/invitation");

        $this->assertError(409, 'password_already_set');
        self::assertEmailCount(0);
    }

    public function testATeacherCannotInviteOrDeleteTheParentOfAnotherTeacher(): void
    {
        $parent = $this->createStudent($this->createTeacher('first@example.test'))->getParent();
        $other = $this->createTeacher('second@example.test');
        $this->client->loginUser($other);

        $this->post("/api/parents/{$parent->getId()}/invitation");
        $this->assertError(403, 'forbidden');

        $this->client->jsonRequest('DELETE', "/api/parents/{$parent->getId()}");
        $this->assertError(403, 'forbidden');

        // A teacher is a User too, but not a parent of this teacher.
        $this->client->jsonRequest('DELETE', "/api/parents/{$other->getId()}");
        $this->assertError(403, 'forbidden');

        self::assertNotNull($this->entityManager()->find(User::class, $parent->getId()));
    }

    public function testDeletingAParentDeletesTheFamilyDataAndTheRecordingsButNotTheMaterial(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher);
        $assignment = $this->createAssignment($student);
        $this->addRecording($assignment, RecordingKind::Video, 'recordings/video');
        $this->addRecording($assignment, RecordingKind::Audio, 'recordings/audio');
        $this->storage()->put('materials/sheet', 'pdf', 'application/pdf');
        // A video that the parent uploaded but never confirmed: it has no database row.
        $this->storage()->put("uploads/recordings/{$assignment->getId()}/video/".str_repeat('a', 32), 'video', 'video/mp4');
        // The same for another family: it must stay.
        $this->storage()->put('uploads/recordings/999999/video/'.str_repeat('b', 32), 'video', 'video/mp4');
        $materialId = $assignment->getMaterial()->getId();
        $parentId = $student->getParent()->getId();
        $studentId = $student->getId();
        $this->client->loginUser($teacher);

        $this->client->jsonRequest('DELETE', "/api/parents/$parentId");

        self::assertResponseStatusCodeSame(204);
        $this->entityManager()->clear();
        self::assertNull($this->entityManager()->find(User::class, $parentId));
        self::assertNull($this->entityManager()->find(Student::class, $studentId));
        foreach (['assignment', 'submission', 'recording', 'feedback'] as $table) {
            self::assertSame(0, $this->entityManager()->getConnection()->fetchOne("SELECT COUNT(*) FROM $table"), "Rows left in $table.");
        }
        // The Material belongs to the teacher: it stays, with its files.
        self::assertNotNull($this->entityManager()->find(Material::class, $materialId));
        self::assertSame(['materials/sheet', 'uploads/recordings/999999/video/'.str_repeat('b', 32)], $this->storage()->keys());
    }

    public function testAfterDeletionTheParentCannotSignIn(): void
    {
        $teacher = $this->createTeacher();
        $parent = $this->createStudent($teacher, 'paula@example.test')->getParent();
        $this->client->loginUser($teacher);
        $this->client->jsonRequest('DELETE', "/api/parents/{$parent->getId()}");
        $this->post('/api/logout');

        $this->post('/api/login', ['email' => 'paula@example.test', 'password' => self::PASSWORD]);

        $this->assertError(401, 'invalid_credentials');
    }

    private function addParentAndReadToken(): string
    {
        $this->post('/api/parents', ['name' => 'Paula Parent', 'email' => 'paula@example.test', 'childName' => 'Charlie']);
        self::assertResponseStatusCodeSame(201);

        return $this->tokenFromEmail();
    }

    private function tokenFromEmail(): string
    {
        $email = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $email);
        self::assertSame(1, preg_match('~#token=([0-9a-f]{64})~', (string) $email->getTextBody(), $match));

        return $match[1];
    }
}
