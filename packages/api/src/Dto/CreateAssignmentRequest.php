<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * The JSON body of "POST /api/assignments": the form "Assign a piece".
 * The files are uploaded before this request; the body has only their upload ids.
 */
final readonly class CreateAssignmentRequest
{
    public const int MAX_SHEET_MUSIC_FILES = 10;
    public const int TEXT_MAX_LENGTH = 5000;
    private const string UPLOAD_ID = '/^[0-9a-f]{32}$/';

    /** @param list<string> $sheetMusicUploadIds */
    public function __construct(
        #[Assert\Positive]
        public int $studentId = 0,
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 200)]
        public string $title = '',
        #[Assert\Length(max: self::TEXT_MAX_LENGTH)]
        public ?string $generalInstruction = null,
        #[Assert\Length(max: self::TEXT_MAX_LENGTH)]
        public ?string $personalInstruction = null,
        #[Assert\Length(max: self::TEXT_MAX_LENGTH)]
        public ?string $parentHint = null,
        /** One PDF, or the pages as images in reading order. */
        #[Assert\Count(max: self::MAX_SHEET_MUSIC_FILES)]
        #[Assert\Unique]
        #[Assert\All([new Assert\Type('string'), new Assert\Regex(self::UPLOAD_ID)])]
        public array $sheetMusicUploadIds = [],
        #[Assert\Regex(self::UPLOAD_ID)]
        public ?string $audioExampleUploadId = null,
    ) {
    }
}
