<?php

declare(strict_types=1);

namespace App\Storage;

/**
 * The storage is not configured, or a request to it failed.
 * The code that calls ObjectStorage catches this class and never an AWS SDK class.
 */
final class StorageException extends \RuntimeException
{
    public static function notConfigured(): self
    {
        return new self('R2 is not configured: set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (see .env.local.example).');
    }
}
