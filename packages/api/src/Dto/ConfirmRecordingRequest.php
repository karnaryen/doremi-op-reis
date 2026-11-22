<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\RecordingKind;
use Symfony\Component\Validator\Constraints as Assert;

/** The JSON body of "POST /api/assignments/{id}/recordings": the browser has sent the file to the storage. */
final readonly class ConfirmRecordingRequest
{
    public function __construct(
        public RecordingKind $kind,
        /** The id from the upload-url answer. The pattern also keeps it safe as a part of a storage key. */
        #[Assert\Regex('/^[0-9a-f]{32}$/')]
        public string $uploadId = '',
    ) {
    }
}
