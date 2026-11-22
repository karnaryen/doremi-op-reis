<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Assignment;
use App\Entity\Material;
use App\Entity\RecordingKind;
use App\Entity\StoredObject;
use App\Entity\Student;
use App\Entity\User;
use App\Tests\Storage\InMemoryObjectStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Clock\Test\ClockSensitiveTrait;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Base class of the API tests. Each test sends real HTTP requests through the whole application:
 * router, firewall, voters, controller, service, Doctrine and the test database (app_test in Docker).
 * Only the storage is a fake (InMemoryObjectStorage) and emails are not sent.
 *
 * The DAMA bundle wraps every test in a database transaction and rolls it back (phpunit.dist.xml),
 * so the rows of one test never reach the next test.
 */
abstract class ApiTestCase extends WebTestCase
{
    use ClockSensitiveTrait;

    protected const string PASSWORD = 'correct horse battery';
    protected const string NOW = '2026-11-22 10:00:00';

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        InMemoryObjectStorage::reset();
        // The services ask a clock for the time. In tests the clock stands still, so dates can be compared exactly.
        self::mockTime(self::NOW);
        $this->client = static::createClient();
        // The limiters of sign-in and sign-up keep their counters in this cache pool, in files: start every test at zero.
        static::getContainer()->get('cache.rate_limiter')->clear();
    }

    // --- Requests and answers ---

    /** @param array<string, mixed> $body */
    protected function post(string $url, array $body = []): void
    {
        $this->client->jsonRequest('POST', $url, $body);
    }

    protected function get(string $url): void
    {
        $this->client->request('GET', $url);
    }

    /**
     * A value of the JSON answer. $path is a list of keys with dots: "parent.email", "violations.0.field".
     * An empty path returns the whole answer.
     */
    protected function json(string $path = ''): mixed
    {
        $value = json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);

        foreach ('' === $path ? [] : explode('.', $path) as $key) {
            self::assertIsArray($value, \sprintf('The answer has no "%s".', $path));
            self::assertArrayHasKey($key, $value, \sprintf('The answer has no "%s".', $path));
            $value = $value[$key];
        }

        return $value;
    }

    protected function jsonInt(string $path): int
    {
        $value = $this->json($path);
        self::assertIsInt($value);

        return $value;
    }

    protected function jsonString(string $path): string
    {
        $value = $this->json($path);
        self::assertIsString($value);

        return $value;
    }

    /** @return list<mixed> */
    protected function jsonList(string $path = ''): array
    {
        $value = $this->json($path);
        self::assertIsList($value);

        return $value;
    }

    protected function assertError(int $status, string $code): void
    {
        self::assertResponseStatusCodeSame($status);
        self::assertSame($code, $this->json('error'));
    }

    // --- Test data ---

    protected function entityManager(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function storage(): InMemoryObjectStorage
    {
        $storage = static::getContainer()->get(InMemoryObjectStorage::class);
        self::assertInstanceOf(InMemoryObjectStorage::class, $storage);

        return $storage;
    }

    protected function createTeacher(string $email = 'teacher@example.test', string $name = 'Tessa Teacher'): User
    {
        $teacher = User::teacher($name, $email, new \DateTimeImmutable(self::NOW));
        $teacher->setPasswordHash(static::getContainer()->get(UserPasswordHasherInterface::class)->hashPassword($teacher, self::PASSWORD));
        $this->save($teacher);

        return $teacher;
    }

    /** A parent who has set a password, with one child. */
    protected function createStudent(User $teacher, string $parentEmail = 'parent@example.test', string $childName = 'Charlie'): Student
    {
        $parent = User::parentOf($teacher, 'Paula Parent', $parentEmail, new \DateTimeImmutable(self::NOW));
        $parent->setPasswordHash(static::getContainer()->get(UserPasswordHasherInterface::class)->hashPassword($parent, self::PASSWORD));
        $student = new Student($parent, $childName, new \DateTimeImmutable(self::NOW));
        $this->save($parent, $student);

        return $student;
    }

    protected function createAssignment(Student $student, string $title = 'Minuet in G'): Assignment
    {
        $teacher = $student->getParent()->getTeacher();
        self::assertNotNull($teacher);

        $material = new Material($teacher, $title, 'Play slowly.', new \DateTimeImmutable(self::NOW));
        $assignment = new Assignment($student, $material, 'Watch the left hand.', 'Count aloud together.', new \DateTimeImmutable(self::NOW));
        $this->save($material, $assignment);

        return $assignment;
    }

    /** Gives the Assignment a recording that is already in the storage, as after a confirmed upload. */
    protected function addRecording(Assignment $assignment, RecordingKind $kind = RecordingKind::Video, string $key = 'recordings/first'): void
    {
        $mimeType = RecordingKind::Video === $kind ? 'video/mp4' : 'audio/mpeg';
        $this->storage()->put($key, 'recording', $mimeType);
        $assignment->submitRecording($kind, new StoredObject($key, $mimeType, 9, new \DateTimeImmutable(self::NOW)), new \DateTimeImmutable(self::NOW));
        $this->entityManager()->flush();
    }

    /** Reads an entity again from the database, as the next request would see it. */
    protected function reload(Assignment $assignment): Assignment
    {
        $this->entityManager()->clear();
        $fresh = $this->entityManager()->find(Assignment::class, $assignment->getId());
        self::assertNotNull($fresh);

        return $fresh;
    }

    protected function save(object ...$entities): void
    {
        foreach ($entities as $entity) {
            $this->entityManager()->persist($entity);
        }
        $this->entityManager()->flush();
    }
}
