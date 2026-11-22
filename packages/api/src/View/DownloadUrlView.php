<?php

declare(strict_types=1);

namespace App\View;

/** JSON answer: a short-lived link to one private file. */
final readonly class DownloadUrlView
{
    public function __construct(
        public string $url,
        /** Seconds until the URL stops working. */
        public int $expiresIn,
    ) {
    }
}
