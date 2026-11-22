<?php

declare(strict_types=1);

namespace App\View;

/**
 * JSON answer: where the browser sends a file.
 *
 * A "view" class is the shape of one JSON answer. The controller returns it with $this->json():
 * the Symfony serializer turns the public properties into JSON fields.
 */
final readonly class UploadUrlView
{
    public function __construct(
        /** The browser sends this id back when the upload is done. */
        public string $uploadId,
        /** A signed URL for one HTTP PUT with the file as the body. */
        public string $uploadUrl,
        /** Seconds until the URL stops working. */
        public int $expiresIn,
    ) {
    }
}
