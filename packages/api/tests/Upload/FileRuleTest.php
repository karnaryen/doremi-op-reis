<?php

declare(strict_types=1);

namespace App\Tests\Upload;

use App\Upload\FileRule;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class FileRuleTest extends TestCase
{
    #[DataProvider('mimeTypes')]
    public function testFindsTheRuleOfAMimeType(string $mimeType, ?FileRule $expected): void
    {
        self::assertSame($expected, FileRule::forMimeType([FileRule::Video, FileRule::Audio], $mimeType));
    }

    /** @return iterable<string, array{string, FileRule|null}> */
    public static function mimeTypes(): iterable
    {
        yield 'video' => ['video/mp4', FileRule::Video];
        yield 'iPhone video' => ['video/quicktime', FileRule::Video];
        yield 'with codec and upper case' => ['Video/WebM; codecs=vp9', FileRule::Video];
        yield 'audio' => ['audio/mpeg', FileRule::Audio];
        yield 'a web page' => ['text/html', null];
        yield 'a type of another rule' => ['application/pdf', null];
        yield 'empty' => ['', null];
    }

    public function testTheSizeMustBeAboveZeroAndNotAboveTheLimit(): void
    {
        self::assertFalse(FileRule::Audio->allowsSize(0));
        self::assertTrue(FileRule::Audio->allowsSize(1));
        self::assertTrue(FileRule::Audio->allowsSize(FileRule::Audio->maxBytes()));
        self::assertFalse(FileRule::Audio->allowsSize(FileRule::Audio->maxBytes() + 1));
    }
}
