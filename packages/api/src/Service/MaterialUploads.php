<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\MaterialFilePurpose;
use App\Entity\User;
use App\Upload\FileRule;
use App\Upload\Uploads;
use App\View\UploadUrlView;

/** Upload URLs for the files of a piece: sheet music and the audio example. */
final readonly class MaterialUploads
{
    /** The key prefix of material files in the bucket (docs/tech/data-model.md). */
    public const string FINAL_PREFIX = 'materials/';
    public const array SHEET_MUSIC_RULES = [FileRule::SheetMusicPdf, FileRule::SheetMusicImage];
    public const array AUDIO_EXAMPLE_RULES = [FileRule::Audio];

    public function __construct(private Uploads $uploads)
    {
    }

    public function createUploadUrl(User $teacher, MaterialFilePurpose $purpose, string $mimeType, int $size): UploadUrlView
    {
        return match ($purpose) {
            MaterialFilePurpose::SheetMusic => $this->uploads->createUploadUrl(self::sheetMusicPrefix($teacher), self::SHEET_MUSIC_RULES, $mimeType, $size),
            MaterialFilePurpose::AudioExample => $this->uploads->createUploadUrl(self::audioExamplePrefix($teacher), self::AUDIO_EXAMPLE_RULES, $mimeType, $size),
        };
    }

    /**
     * The temporary keys have the id of the teacher: Assignments::create() builds the key from the signed-in teacher
     * and the upload id, so a teacher can only use files that they have uploaded themselves.
     */
    public static function sheetMusicPrefix(User $teacher): string
    {
        return \sprintf('uploads/materials/%d/sheet-music/', (int) $teacher->getId());
    }

    public static function audioExamplePrefix(User $teacher): string
    {
        return \sprintf('uploads/materials/%d/audio-example/', (int) $teacher->getId());
    }
}
