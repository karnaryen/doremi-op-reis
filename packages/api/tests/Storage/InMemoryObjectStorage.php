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
 */
final class InMemoryObjectStorage implements ObjectStorage
{
    public const string BASE_URL = 'https://storage.test/';
    public const string UPLOAD_MARK = 'upload';
    public const string DOWNLOAD_MARK = 'download';

    /** The HTTP status that a PUT to an upload URL gets. Set 403 to test a refused upload. */
    public int $uploadStatus = 200;

    /** @var array<string, array{body: string, contentType: string}> */
    private array $objects = [];

    /** @var array<string, StorageException> method name => what it throws */
    private array $failures = [];

    /** Makes one method of ObjectStorage throw, to test what the app does when the storage fails. */
    public function failOn(string $method, StorageException $failure): void
    {
        $this->failures[$method] = $failure;
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
        $object = $this->objects[$key] ?? null;

        return null === $object ? null : new ObjectInfo(\strlen($object['body']), $object['contentType']);
    }

    public function delete(string $key): void
    {
        $this->failIfAsked(__FUNCTION__);
        unset($this->objects[$key]);
    }

    public function put(string $key, string $body, string $contentType): void
    {
        $this->objects[$key] = ['body' => $body, 'contentType' => $contentType];
    }

    public function get(string $key): ?string
    {
        return $this->objects[$key]['body'] ?? null;
    }

    public function count(): int
    {
        return \count($this->objects);
    }

    private function failIfAsked(string $method): void
    {
        if (isset($this->failures[$method])) {
            throw $this->failures[$method];
        }
    }
}
