<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\MaterialFilePurpose;
use Symfony\Component\Validator\Constraints as Assert;

/** The JSON body of "POST /api/material-uploads": the teacher is going to upload one file of a piece. */
final readonly class MaterialUploadRequest
{
    public function __construct(
        public MaterialFilePurpose $purpose,
        /** What the browser says about the file. It is checked again after the upload. */
        // Not "NotBlank": a browser sends an empty type for a file it does not know.
        // The file rules then answer "file not accepted", which the user understands.
        #[Assert\Length(max: 100)]
        public string $mimeType = '',
        #[Assert\Positive]
        public int $size = 0,
    ) {
    }
}
