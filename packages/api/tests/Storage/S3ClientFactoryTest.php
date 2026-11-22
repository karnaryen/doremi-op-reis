<?php

declare(strict_types=1);

namespace App\Tests\Storage;

use App\Storage\S3ClientFactory;
use App\Storage\StorageException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class S3ClientFactoryTest extends TestCase
{
    public function testTheClientUsesTheR2EndpointAndRegion(): void
    {
        $client = new S3ClientFactory('https://account-id.eu.r2.cloudflarestorage.com', 'key-id', 'secret')->create();

        self::assertSame('https://account-id.eu.r2.cloudflarestorage.com', (string) $client->getEndpoint());
        self::assertSame('auto', $client->getRegion());
    }

    #[DataProvider('incompleteSettings')]
    public function testAMissingSettingIsAnErrorAndNotAFallbackToAmazon(string $endpoint, string $keyId, string $secret): void
    {
        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('R2 is not configured');

        new S3ClientFactory($endpoint, $keyId, $secret)->create();
    }

    #[DataProvider('endpointsThatAreNotHttpsUrls')]
    public function testTheEndpointMustBeAnHttpsUrl(string $endpoint): void
    {
        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('R2_ENDPOINT must be a URL that starts with https://');

        new S3ClientFactory($endpoint, 'key-id', 'secret')->create();
    }

    /** @return iterable<string, array{string}> */
    public static function endpointsThatAreNotHttpsUrls(): iterable
    {
        yield 'no scheme' => ['account-id.r2.cloudflarestorage.com'];
        yield 'http: files would travel without encryption' => ['http://account-id.r2.cloudflarestorage.com'];
        yield 'no host' => ['https://'];
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function incompleteSettings(): iterable
    {
        yield 'no endpoint' => ['', 'key-id', 'secret'];
        yield 'no key id' => ['https://account-id.r2.cloudflarestorage.com', '', 'secret'];
        yield 'no secret' => ['https://account-id.r2.cloudflarestorage.com', 'key-id', ''];
    }
}
