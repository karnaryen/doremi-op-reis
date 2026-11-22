<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Storage\StorageException;
use App\Tests\Storage\InMemoryObjectStorage;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Integration tests: the real container and the real test database (app_test in Docker).
 * The storage is the in-memory fake (config/services.yaml, when@test).
 */
final class CheckCommandTest extends KernelTestCase
{
    protected function setUp(): void
    {
        InMemoryObjectStorage::reset();
    }

    public function testSucceedsWhenDatabaseAndStorageWork(): void
    {
        $result = self::runCommand('app:check');

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('The API reaches PostgreSQL and the file storage.', $result->getOutput());

        self::assertSame(0, self::storage()->count(), 'The command must delete its test object.');
    }

    public function testFailsAndShowsTheFirstErrorWhenTheStorageDoesNotWork(): void
    {
        self::storage()->failOn('createUploadUrl', new StorageException('R2 is not configured.'));
        // The command always tries to delete its test object. This second error must not hide the cause.
        self::storage()->failOn('delete', new StorageException('The delete failed too.'));

        $result = self::runCommand('app:check');

        $this->assertCommandFailed($result);
        self::assertStringContainsString('R2 is not configured.', $result->getOutput());
        self::assertStringNotContainsString('The delete failed too.', $result->getOutput());
        // The database part still ran and passed.
        self::assertMatchesRegularExpression('/PostgreSQL\s+OK/', $result->getOutput());
    }

    public function testFailsWhenTheStorageRefusesTheUpload(): void
    {
        // For example: the API token may read but not write.
        InMemoryObjectStorage::$uploadStatus = 403;

        $result = self::runCommand('app:check');

        $this->assertCommandFailed($result);
        self::assertStringContainsString('The upload through a signed URL failed: HTTP 403.', $result->getOutput());
    }

    public function testFailsWhenTheTestObjectCannotBeDeleted(): void
    {
        self::storage()->failOn('delete', new StorageException('Could not delete the object: AccessDenied.'));

        $result = self::runCommand('app:check');

        $this->assertCommandFailed($result);
        self::assertStringContainsString('Could not delete the object: AccessDenied.', $result->getOutput());
    }

    private static function storage(): InMemoryObjectStorage
    {
        $storage = self::getContainer()->get(InMemoryObjectStorage::class);
        self::assertInstanceOf(InMemoryObjectStorage::class, $storage);

        return $storage;
    }
}
