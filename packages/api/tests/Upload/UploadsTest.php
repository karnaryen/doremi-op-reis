<?php

declare(strict_types=1);

namespace App\Tests\Upload;

use App\Exception\RuleViolation;
use App\Storage\StorageException;
use App\Tests\Storage\InMemoryObjectStorage;
use App\Upload\FileRule;
use App\Upload\Uploads;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Clock\MockClock;

/** Unit tests with the in-memory storage: no container, no database. */
final class UploadsTest extends TestCase
{
    private InMemoryObjectStorage $storage;
    private Uploads $uploads;

    protected function setUp(): void
    {
        InMemoryObjectStorage::reset();
        $this->storage = new InMemoryObjectStorage();
        $this->uploads = new Uploads($this->storage, new MockClock('2026-11-22 10:00:00'), new NullLogger());
    }

    public function testTheUploadUrlPointsToATemporaryKeyWithARandomId(): void
    {
        $upload = $this->uploads->createUploadUrl('uploads/recordings/7/video/', [FileRule::Video], 'video/mp4', 1000);

        self::assertMatchesRegularExpression('/^[0-9a-f]{32}$/', $upload->uploadId);
        self::assertSame(InMemoryObjectStorage::BASE_URL.'uploads/recordings/7/video/'.$upload->uploadId.'?'.InMemoryObjectStorage::UPLOAD_MARK, $upload->uploadUrl);
        self::assertSame(900, $upload->expiresIn);
    }

    public function testNoUploadUrlForATypeThatIsNotAllowed(): void
    {
        $this->expectExceptionObject(RuleViolation::fileNotAccepted('Files of the type "text/html" are not accepted here.'));

        $this->uploads->createUploadUrl('uploads/x/', [FileRule::Video], 'text/html', 1000);
    }

    public function testNoUploadUrlForAFileThatIsTooLarge(): void
    {
        $this->expectException(RuleViolation::class);
        $this->expectExceptionMessage('larger than 200 MB');

        $this->uploads->createUploadUrl('uploads/x/', [FileRule::Video], 'video/mp4', FileRule::Video->maxBytes() + 1);
    }

    public function testAcceptCopiesTheUploadToAFinalKey(): void
    {
        $this->storage->put('uploads/x/abc', 'the video', 'video/mp4; codecs=avc1');

        $file = $this->uploads->accept('uploads/x/abc', 'recordings/', [FileRule::Video]);

        self::assertMatchesRegularExpression('#^recordings/[0-9a-f]{32}$#', $file->objectKey);
        self::assertSame('video/mp4', $file->mimeType);
        self::assertSame(9, $file->size);
        self::assertEquals(new \DateTimeImmutable('2026-11-22 10:00:00'), $file->uploadedAt);
        self::assertSame('the video', $this->storage->get($file->objectKey));
        // The temporary object stays until the caller has saved the row.
        self::assertTrue($this->storage->has('uploads/x/abc'));
    }

    public function testAcceptFailsWhenNothingWasUploaded(): void
    {
        $this->expectExceptionObject(RuleViolation::uploadNotFound());

        $this->uploads->accept('uploads/x/missing', 'recordings/', [FileRule::Video]);
    }

    public function testAcceptDeletesAFileOfTheWrongType(): void
    {
        // The browser said "video/mp4" when it asked for the URL, and then sent a web page.
        $this->storage->put('uploads/x/abc', '<script>', 'text/html');

        try {
            $this->uploads->accept('uploads/x/abc', 'recordings/', [FileRule::Video]);
            self::fail('The file must be refused.');
        } catch (RuleViolation $e) {
            self::assertSame('file_not_accepted', $e->errorCode);
        }

        self::assertSame(0, $this->storage->count(), 'The copy and the upload must both be deleted.');
    }

    public function testDiscardNeverThrows(): void
    {
        $this->storage->put('recordings/old', 'x', 'video/mp4');
        $this->storage->failOn('delete', new StorageException('R2 is down.'));

        $this->uploads->discard('recordings/old');

        self::assertTrue($this->storage->has('recordings/old'), 'The object stays; the daily job removes it later.');
    }
}
