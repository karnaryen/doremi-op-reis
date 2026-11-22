<?php

declare(strict_types=1);

namespace App\Upload;

/**
 * Which files the app accepts: the MIME types and the largest size of each kind of file.
 *
 * A signed upload URL does not limit the type or the size (docs/tech/backend.md, "Signed URLs"),
 * so these rules are checked twice: before the URL is made (what the browser says about the file)
 * and after the upload (what the storage says about the object).
 *
 * The sizes are a first choice: the maximum recording length is an open question (docs/roadmap.md).
 */
enum FileRule
{
    case Video;
    case Audio;
    case SheetMusicPdf;
    case SheetMusicImage;

    private const int MB = 1024 * 1024;

    /** @return list<string> */
    public function mimeTypes(): array
    {
        return match ($this) {
            // video/quicktime: the camera of an iPhone saves .mov files.
            self::Video => ['video/mp4', 'video/quicktime', 'video/webm'],
            self::Audio => ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'],
            self::SheetMusicPdf => ['application/pdf'],
            self::SheetMusicImage => ['image/jpeg', 'image/png'],
        };
    }

    public function maxBytes(): int
    {
        return match ($this) {
            self::Video => 200 * self::MB,
            self::Audio => 30 * self::MB,
            self::SheetMusicPdf, self::SheetMusicImage => 15 * self::MB,
        };
    }

    /** "video/webm;codecs=vp9" and "Video/WebM" are both "video/webm". */
    public static function normalizeMimeType(string $mimeType): string
    {
        return strtolower(trim(explode(';', $mimeType, 2)[0]));
    }

    /**
     * The first of the given rules that allows this MIME type, or null.
     *
     * @param list<self> $rules
     */
    public static function forMimeType(array $rules, string $mimeType): ?self
    {
        $mimeType = self::normalizeMimeType($mimeType);

        return array_find($rules, static fn (self $rule): bool => \in_array($mimeType, $rule->mimeTypes(), true));
    }

    public function allowsSize(int $bytes): bool
    {
        return $bytes > 0 && $bytes <= $this->maxBytes();
    }
}
