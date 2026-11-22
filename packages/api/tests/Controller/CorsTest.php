<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * The test environment allows one origin: https://app.example.test (CORS_ALLOW_ORIGIN in .env.test).
 * The value there has no ^ and $: config/packages/nelmio_cors.yaml adds them.
 */
final class CorsTest extends WebTestCase
{
    private const string ALLOWED_ORIGIN = 'https://app.example.test';

    public function testAnAllowedOriginMayReadTheAnswer(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/health', server: ['HTTP_ORIGIN' => self::ALLOWED_ORIGIN]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Access-Control-Allow-Origin', self::ALLOWED_ORIGIN);
        // The SPA sends the session cookie: without this header the browser hides the answer from the page.
        self::assertResponseHeaderSame('Access-Control-Allow-Credentials', 'true');
    }

    /** The regular expression must match the whole origin, not a part of it. */
    #[DataProvider('otherOrigins')]
    public function testAnotherOriginGetsNoCorsHeader(string $origin): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/health', server: ['HTTP_ORIGIN' => $origin]);

        // The request itself still works: CORS only tells the browser not to show the answer to the page.
        self::assertResponseIsSuccessful();
        self::assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }

    /** @return iterable<string, array{string}> */
    public static function otherOrigins(): iterable
    {
        yield 'another site' => ['https://evil.example'];
        yield 'allowed origin as a subdomain of another site' => ['https://app.example.test.evil.example'];
        yield 'allowed origin with another scheme' => ['http://app.example.test'];
    }

    public function testThePreflightRequestOfAnAllowedOriginIsAnswered(): void
    {
        $client = static::createClient();

        // The browser sends this before a request with a JSON body.
        $client->request('OPTIONS', '/api/health', server: [
            'HTTP_ORIGIN' => self::ALLOWED_ORIGIN,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Access-Control-Allow-Origin', self::ALLOWED_ORIGIN);
        self::assertResponseHeaderSame('Access-Control-Allow-Headers', 'content-type');
        self::assertStringContainsString('POST', (string) $client->getResponse()->headers->get('Access-Control-Allow-Methods'));
    }

    public function testThePreflightRequestOfAnotherOriginGetsNoCorsHeader(): void
    {
        $client = static::createClient();

        $client->request('OPTIONS', '/api/health', server: [
            'HTTP_ORIGIN' => 'https://evil.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        self::assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }
}
