<?php

declare(strict_types=1);

namespace App\Storage;

/** What the storage knows about one object. */
final readonly class ObjectInfo
{
    public function __construct(
        /** Size in bytes. */
        public int $size,
        /** MIME type that the uploader sent, for example "video/mp4". The storage does not check it. */
        public string $contentType,
    ) {
    }
}
