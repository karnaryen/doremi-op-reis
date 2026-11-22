<?php

declare(strict_types=1);

namespace App\Tests\Storage;

use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Contracts\HttpClient\ResponseInterface;

/**
 * Answers the HTTP client in tests (framework.http_client.mock_response_factory), so no test sends a real request.
 * It makes the URLs of InMemoryObjectStorage work: a PUT to an upload URL saves an object,
 * a GET of a download URL returns it. Like R2, it refuses a URL that was signed for another method.
 *
 * https://symfony.com/doc/current/http_client.html#testing
 */
final readonly class InMemoryStorageResponseFactory
{
    public function __construct(private InMemoryObjectStorage $storage)
    {
    }

    /** @param array<string, mixed> $options */
    public function __invoke(string $method, string $url, array $options): ResponseInterface
    {
        if (!str_starts_with($url, InMemoryObjectStorage::BASE_URL)) {
            throw new \LogicException(\sprintf('A test sent an HTTP request to "%s". Only the fake storage answers in tests.', $url));
        }

        [$path, $mark] = explode('?', $url, 2) + [1 => ''];
        $key = substr($path, \strlen(InMemoryObjectStorage::BASE_URL));

        if ('PUT' === $method && InMemoryObjectStorage::UPLOAD_MARK === $mark) {
            if (200 !== InMemoryObjectStorage::$uploadStatus) {
                return new MockResponse('', ['http_code' => InMemoryObjectStorage::$uploadStatus]);
            }

            $body = $options['body'] ?? '';
            $this->storage->put($key, \is_string($body) ? $body : '', self::contentType($options));

            return new MockResponse('', ['http_code' => 200]);
        }

        if ('GET' === $method && InMemoryObjectStorage::DOWNLOAD_MARK === $mark) {
            $body = $this->storage->get($key);

            return null === $body ? new MockResponse('', ['http_code' => 404]) : new MockResponse($body, ['http_code' => 200]);
        }

        // The URL was made for another HTTP method: the signature does not match.
        return new MockResponse('', ['http_code' => 403]);
    }

    /** @param array<string, mixed> $options */
    private static function contentType(array $options): string
    {
        $headers = $options['normalized_headers'] ?? null;
        $lines = \is_array($headers) ? ($headers['content-type'] ?? null) : null;
        $line = \is_array($lines) ? ($lines[0] ?? null) : null;

        // The HTTP client gives a header as one line: "Content-Type: text/plain".
        return \is_string($line) ? trim(substr($line, \strlen('Content-Type:'))) : 'application/octet-stream';
    }
}
