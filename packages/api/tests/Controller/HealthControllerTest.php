<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HealthControllerTest extends WebTestCase
{
    public function testHealthReturnsOk(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/health');

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Type', 'application/json');
        self::assertSame(['status' => 'ok'], json_decode((string) $client->getResponse()->getContent(), true));
    }

    public function testHealthAcceptsOnlyGet(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/health');

        self::assertResponseStatusCodeSame(405);
    }
}
