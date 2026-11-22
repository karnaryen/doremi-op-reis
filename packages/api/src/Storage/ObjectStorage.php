<?php

declare(strict_types=1);

namespace App\Storage;

/**
 * The file storage of the app: a private bucket in Cloudflare R2.
 *
 * Files do not pass through Symfony. The browser sends and gets them directly,
 * with a signed URL that is valid for a short time (docs/tech/architecture.md, "Upload flow").
 * The app code uses this interface, so tests can replace R2 with a fake.
 *
 * A key is the name of an object in the bucket, for example "recordings/0198c0de.mp4".
 * The server makes the key; it never comes from the request.
 */
interface ObjectStorage
{
    /** The longest life of a signed URL that R2 accepts: 7 days. */
    public const int MAX_URL_TTL_SECONDS = 604_800;

    /**
     * A URL for an HTTP PUT that saves the request body under this key.
     *
     * The URL fixes only the key and the time. It does not limit the size or the type of the file,
     * and it works many times until it expires: a second PUT replaces the object.
     * So check the object with getInfo() after the upload, and do not trust this key before the URL has expired
     * (docs/tech/backend.md, "Signed URLs").
     *
     * @throws StorageException
     */
    public function createUploadUrl(string $key, int $ttlSeconds): string;

    /**
     * A URL for an HTTP GET of this object. It works many times until it expires.
     * Check the access of the user before you call this.
     *
     * @throws StorageException
     */
    public function createDownloadUrl(string $key, int $ttlSeconds): string;

    /**
     * Size and type of the object, or null if no object has this key.
     *
     * @throws StorageException
     */
    public function getInfo(string $key): ?ObjectInfo;

    /**
     * Deletes the object. Does nothing if no object has this key.
     *
     * @throws StorageException
     */
    public function delete(string $key): void;
}
