<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\RecordingKind;
use Symfony\Component\Validator\Constraints as Assert;

/** The JSON body of "POST /api/assignments/{id}/recordings/upload-url". */
final readonly class RecordingUploadRequest
{
    public function __construct(
        public RecordingKind $kind,
        // Not "NotBlank": a browser sends an empty type for a file it does not know.
        // The file rules then answer "file not accepted", which the user understands.
        #[Assert\Length(max: 100)]
        public string $mimeType = '',
        #[Assert\Positive]
        public int $size = 0,
    ) {
    }
}
