<?php

declare(strict_types=1);

namespace App\Tests\Storage;

use App\Storage\ObjectInfo;
use App\Storage\ObjectStorage;
use App\Storage\StorageException;

/**
 * The storage for tests: objects live in a PHP array, no request leaves the computer.
 * put() and get() play the role of the browser that uses a signed URL
 * (InMemoryStorageResponseFactory calls them for the HTTP client).
 *
 * The state is static: the test client builds a new container for every request, and the objects of the first
 * request must still be there in the second one. So every test class that uses the storage calls reset() in setUp().
 */
final class InMemoryObjectStorage implements ObjectStorage
{
    public const string BASE_URL = 'https://storage.test/';
    public const string UPLOAD_MARK = 'upload';
    public const string DOWNLOAD_MARK = 'download';

    /** The HTTP status that a PUT to an upload URL gets. Set 403 to test a refused upload. */
    public static int $uploadStatus = 200;

    /** @var array<string, array{body: string, contentType: string}> */
    private static array $objects = [];

    /** @var array<string, StorageException> method name => what it throws */
    private static array $failures = [];

    /** Makes one method of ObjectStorage throw, to test what the app does when the storage fails. */
    public function failOn(string $method, StorageException $failure): void
    {
        self::$failures[$method] = $failure;
    }

    public function createUploadUrl(string $key, int $ttlSeconds): string
    {
        $this->failIfAsked(__FUNCTION__);

        return self::BASE_URL.$key.'?'.self::UPLOAD_MARK;
    }

    public function createDownloadUrl(string $key, int $ttlSeconds): string
    {
        $this->failIfAsked(__FUNCTION__);

        return self::BASE_URL.$key.'?'.self::DOWNLOAD_MARK;
    }

    public function getInfo(string $key): ?ObjectInfo
    {
        $this->failIfAsked(__FUNCTION__);
        $object = self::$objects[$key] ?? null;

        return null === $object ? null : new ObjectInfo(\strlen($object['body']), $object['contentType']);
    }

    public function copy(string $sourceKey, string $targetKey): bool
    {
        $this->failIfAsked(__FUNCTION__);
        if (!isset(self::$objects[$sourceKey])) {
            return false;
        }

        self::$objects[$targetKey] = self::$objects[$sourceKey];

        return true;
    }

    public function deletePrefix(string $prefix): void
    {
        $this->failIfAsked(__FUNCTION__);
        foreach (array_keys(self::$objects) as $key) {
            if (str_starts_with($key, $prefix)) {
                unset(self::$objects[$key]);
            }
        }
    }

    public function delete(string $key): void
    {
        $this->failIfAsked(__FUNCTION__);
        unset(self::$objects[$key]);
    }

    public function put(string $key, string $body, string $contentType): void
    {
        self::$objects[$key] = ['body' => $body, 'contentType' => $contentType];
    }

    public function get(string $key): ?string
    {
        return self::$objects[$key]['body'] ?? null;
    }

    public function count(): int
    {
        return \count(self::$objects);
    }

    /** @return list<string> */
    public function keys(): array
    {
        return array_keys(self::$objects);
    }

    public function has(string $key): bool
    {
        return isset(self::$objects[$key]);
    }

    /** Forgets all objects and failures. */
    public static function reset(): void
    {
        self::$objects = [];
        self::$failures = [];
        self::$uploadStatus = 200;
    }

    private function failIfAsked(string $method): void
    {
        if (isset(self::$failures[$method])) {
            throw self::$failures[$method];
        }
    }
}
