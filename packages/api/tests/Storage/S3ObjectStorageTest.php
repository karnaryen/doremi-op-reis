<?php

declare(strict_types=1);

namespace App\Tests\Storage;

use App\Storage\ObjectInfo;
use App\Storage\ObjectStorage;
use App\Storage\S3ObjectStorage;
use App\Storage\StorageException;
use Aws\Handler\Guzzle\GuzzleHandler;
use Aws\S3\S3Client;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\RequestInterface;

/**
 * Unit tests: no request leaves the computer. A mock HTTP handler answers instead of R2,
 * so the real AWS SDK code builds every request and reads every answer.
 */
final class S3ObjectStorageTest extends TestCase
{
    private const string OBJECT_URL = 'https://test-bucket.account-id.r2.cloudflarestorage.com/recordings/a.mp4';

    private MockHandler $r2;
    private S3ObjectStorage $storage;

    protected function setUp(): void
    {
        $this->r2 = new MockHandler();
        $this->storage = new S3ObjectStorage($this->client(), 'test-bucket');
    }

    public function testUploadUrlIsASignedPutUrlForTheKey(): void
    {
        $url = $this->storage->createUploadUrl('recordings/a b.mp4', 900);

        self::assertStringStartsWith('https://test-bucket.account-id.r2.cloudflarestorage.com/recordings/a%20b.mp4?', $url);
        $query = self::query($url);
        self::assertSame('900', $query['X-Amz-Expires']);
        self::assertSame('AWS4-HMAC-SHA256', $query['X-Amz-Algorithm']);
        self::assertStringStartsWith('test-key-id/', $query['X-Amz-Credential']);
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $query['X-Amz-Signature']);
        // Only the host is signed: the URL does not fix the type or the size of the file (docs/tech/backend.md).
        self::assertSame('host', $query['X-Amz-SignedHeaders']);
        // The secret signs the URL but is never a part of it.
        self::assertStringNotContainsString('test-secret', $url);
        // Signing is local: no request was sent to R2.
        self::assertNull($this->r2->getLastRequest());
    }

    public function testUploadAndDownloadUrlsHaveDifferentSignatures(): void
    {
        $upload = self::query($this->storage->createUploadUrl('recordings/a.mp4', 60));
        $download = self::query($this->storage->createDownloadUrl('recordings/a.mp4', 60));

        // The HTTP method is a part of the signature: a download URL cannot upload.
        self::assertNotSame($upload['X-Amz-Signature'], $download['X-Amz-Signature']);
    }

    #[DataProvider('validTtls')]
    public function testUrlLifetimeIsTheGivenNumberOfSeconds(int $ttlSeconds): void
    {
        $query = self::query($this->storage->createDownloadUrl('recordings/a.mp4', $ttlSeconds));

        self::assertSame((string) $ttlSeconds, $query['X-Amz-Expires']);
    }

    /** @return iterable<string, array{int}> */
    public static function validTtls(): iterable
    {
        yield 'shortest' => [1];
        yield 'longest: 7 days' => [ObjectStorage::MAX_URL_TTL_SECONDS];
    }

    #[DataProvider('invalidTtls')]
    public function testUrlLifetimeMustBeInTheRangeOfR2(int $ttlSeconds): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->storage->createDownloadUrl('recordings/a.mp4', $ttlSeconds);
    }

    /** @return iterable<string, array{int}> */
    public static function invalidTtls(): iterable
    {
        yield 'zero' => [0];
        yield 'negative' => [-60];
        yield 'more than 7 days' => [ObjectStorage::MAX_URL_TTL_SECONDS + 1];
    }

    public function testGetInfoReturnsSizeAndType(): void
    {
        $this->r2->append(new Response(200, ['Content-Length' => '1234', 'Content-Type' => 'video/mp4']));

        self::assertEquals(new ObjectInfo(1234, 'video/mp4'), $this->storage->getInfo('recordings/a.mp4'));

        self::assertSame('HEAD', $this->lastRequest()->getMethod());
        self::assertSame(self::OBJECT_URL, (string) $this->lastRequest()->getUri());
    }

    public function testGetInfoReturnsNullWhenTheObjectDoesNotExist(): void
    {
        $this->r2->append(new Response(404));

        self::assertNull($this->storage->getInfo('recordings/a.mp4'));
    }

    public function testGetInfoFailsWithTheHttpStatusWhenR2RefusesTheRequest(): void
    {
        // An answer to HEAD has no body, so there is no AWS error code to show.
        $this->r2->append(new Response(403));

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('Could not read the object "recordings/a.mp4": HTTP 403.');

        $this->storage->getInfo('recordings/a.mp4');
    }

    public function testGetInfoFailsWhenR2SendsNoSize(): void
    {
        $this->r2->append(new Response(200, ['Content-Type' => 'video/mp4']));

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('no size');

        $this->storage->getInfo('recordings/a.mp4');
    }

    public function testGetInfoFailsWhenR2DoesNotAnswer(): void
    {
        $this->r2->append(static fn (RequestInterface $request): ConnectException => new ConnectException('Connection refused', $request));

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('Could not read the object "recordings/a.mp4": no answer from the storage.');

        $this->storage->getInfo('recordings/a.mp4');
    }

    public function testDeleteSendsADeleteRequestForTheKey(): void
    {
        $this->r2->append(new Response(204));

        $this->storage->delete('recordings/a.mp4');

        self::assertSame('DELETE', $this->lastRequest()->getMethod());
        self::assertSame(self::OBJECT_URL, (string) $this->lastRequest()->getUri());
    }

    public function testDeleteFailsWithTheErrorCodeOfR2(): void
    {
        $this->r2->append(new Response(403, [], '<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>'));

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('Could not delete the object "recordings/a.mp4": AccessDenied.');

        $this->storage->delete('recordings/a.mp4');
    }

    public function testCopySendsTheSourceAsBucketAndKey(): void
    {
        $this->r2->append(new Response(200, [], '<?xml version="1.0" encoding="UTF-8"?><CopyObjectResult><ETag>"abc"</ETag></CopyObjectResult>'));

        self::assertTrue($this->storage->copy('uploads/recordings/7/video/a b', 'recordings/a.mp4'));

        // A copy is a PUT to the new key; the header names the object to copy.
        self::assertSame('PUT', $this->lastRequest()->getMethod());
        self::assertSame(self::OBJECT_URL, (string) $this->lastRequest()->getUri());
        self::assertSame('test-bucket/uploads/recordings/7/video/a%20b', $this->lastRequest()->getHeaderLine('x-amz-copy-source'));
    }

    public function testCopyReturnsFalseWhenTheSourceDoesNotExist(): void
    {
        $this->r2->append(new Response(404, [], '<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>'));

        self::assertFalse($this->storage->copy('uploads/missing', 'recordings/a.mp4'));
    }

    public function testCopyFailsWithTheErrorCodeOfR2(): void
    {
        $this->r2->append(new Response(403, [], '<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>'));

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('Could not copy the object "uploads/a": AccessDenied.');

        $this->storage->copy('uploads/a', 'recordings/a.mp4');
    }

    public function testDeletePrefixDeletesEveryListedObjectOnEveryPage(): void
    {
        $page = static fn (string $keys, string $more): Response => new Response(200, [], '<?xml version="1.0" encoding="UTF-8"?><ListBucketResult>'.$keys.$more.'</ListBucketResult>');
        $this->r2->append(
            $page('<Contents><Key>uploads/recordings/7/video/a</Key></Contents><Contents><Key>uploads/recordings/7/audio/b</Key></Contents>', '<IsTruncated>true</IsTruncated><NextContinuationToken>next-page</NextContinuationToken>'),
            new Response(204),
            new Response(204),
            $page('<Contents><Key>uploads/recordings/7/video/c</Key></Contents>', '<IsTruncated>false</IsTruncated>'),
            new Response(204),
        );

        $this->storage->deletePrefix('uploads/recordings/7/');

        // Every answer was used: two list requests and three deletes.
        self::assertCount(0, $this->r2);
        self::assertSame('DELETE', $this->lastRequest()->getMethod());
        self::assertStringEndsWith('/uploads/recordings/7/video/c', $this->lastRequest()->getUri()->getPath());
    }

    public function testDeletePrefixSendsThePrefixToR2(): void
    {
        $this->r2->append(new Response(200, [], '<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>'));

        $this->storage->deletePrefix('uploads/recordings/7/');

        parse_str($this->lastRequest()->getUri()->getQuery(), $query);
        self::assertSame('2', $query['list-type'] ?? null);
        self::assertSame('uploads/recordings/7/', $query['prefix'] ?? null);
    }

    public function testDeletePrefixRefusesAnEmptyPrefix(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->storage->deletePrefix('');
    }

    public function testAnEmptyBucketNameIsAConfigurationError(): void
    {
        $storage = new S3ObjectStorage($this->client(), '');

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('R2_BUCKET');

        $storage->createUploadUrl('recordings/a.mp4', 60);
    }

    public function testAnEmptyKeyIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->storage->delete('');
    }

    private function client(): S3Client
    {
        return new S3Client([
            'region' => 'auto',
            'endpoint' => 'https://account-id.r2.cloudflarestorage.com',
            'credentials' => ['key' => 'test-key-id', 'secret' => 'test-secret'],
            // The SDK sends requests with Guzzle. The mock sits where the network would be.
            'http_handler' => new GuzzleHandler(new Client(['handler' => HandlerStack::create($this->r2)])),
            // The SDK repeats a failed request up to 3 times. One try keeps one answer per test.
            'retries' => 0,
        ]);
    }

    private function lastRequest(): RequestInterface
    {
        $request = $this->r2->getLastRequest();
        self::assertNotNull($request, 'No request was sent to the storage.');

        return $request;
    }

    /** @return array<string, string> */
    private static function query(string $url): array
    {
        parse_str((string) parse_url($url, \PHP_URL_QUERY), $query);

        /** @var array<string, string> $query */
        return $query;
    }
}
