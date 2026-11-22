<?php

declare(strict_types=1);

namespace App\Command;

use App\Storage\ObjectStorage;
use App\Storage\StorageException;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception as DatabaseException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Checks that the API reaches PostgreSQL and the file storage (Cloudflare R2).
 * Run it after a change in the configuration: `bin/console app:check`.
 *
 * The storage check does what the app does later: it uploads a small object through a signed URL
 * (the way a browser does), reads it back and deletes it.
 * This is a console command and not an HTTP endpoint: a public endpoint would let anybody
 * make the API call the database and R2.
 */
#[AsCommand(name: 'app:check', description: 'Checks the connection to PostgreSQL and to the file storage.')]
final readonly class CheckCommand
{
    private const string TEST_CONTENT = 'Doremi op reis: storage check';
    private const int URL_TTL_SECONDS = 60;

    public function __construct(
        private Connection $connection,
        private ObjectStorage $storage,
        private HttpClientInterface $httpClient,
    ) {
    }

    public function __invoke(SymfonyStyle $io): int
    {
        $databaseError = $this->checkDatabase();
        $storageError = $this->checkStorage();

        $io->definitionList(
            ['PostgreSQL' => $databaseError ?? 'OK'],
            ['File storage' => $storageError ?? 'OK'],
        );

        if (null !== $databaseError || null !== $storageError) {
            $io->error('A service does not work. Check the env vars: DATABASE_URL and R2_*.');

            return Command::FAILURE;
        }

        $io->success('The API reaches PostgreSQL and the file storage.');

        return Command::SUCCESS;
    }

    /** @return string|null the error, or null if the database answers */
    private function checkDatabase(): ?string
    {
        try {
            $this->connection->fetchOne('SELECT 1');
        } catch (DatabaseException $e) {
            return $e->getMessage();
        }

        return null;
    }

    /** @return string|null the error, or null if upload, read and delete all work */
    private function checkStorage(): ?string
    {
        $key = 'checks/'.bin2hex(random_bytes(8)).'.txt';

        try {
            $error = $this->uploadAndRead($key);
        } catch (StorageException $e) {
            $error = $e->getMessage();
        } catch (TransportExceptionInterface) {
            // The message of the HTTP client contains the signed URL, so it is not shown.
            // (With -vv the HTTP client itself logs the URL of every request. The URL lives 60 seconds.)
            $error = 'No connection to the storage: check R2_ENDPOINT.';
        }

        // Always try to delete the test object, but keep the first error: it names the cause.
        try {
            $this->storage->delete($key);
        } catch (StorageException $e) {
            $error ??= $e->getMessage();
        }

        return $error;
    }

    /**
     * @return string|null the error, or null if the object was uploaded and read back
     *
     * @throws StorageException
     * @throws TransportExceptionInterface
     */
    private function uploadAndRead(string $key): ?string
    {
        $upload = $this->httpClient->request('PUT', $this->storage->createUploadUrl($key, self::URL_TTL_SECONDS), [
            'headers' => ['Content-Type' => 'text/plain'],
            'body' => self::TEST_CONTENT,
        ]);
        if ($upload->getStatusCode() < 200 || $upload->getStatusCode() >= 300) {
            return \sprintf('The upload through a signed URL failed: HTTP %d.', $upload->getStatusCode());
        }

        if (\strlen(self::TEST_CONTENT) !== $this->storage->getInfo($key)?->size) {
            return 'The uploaded object was not found, or its size is wrong.';
        }

        $download = $this->httpClient->request('GET', $this->storage->createDownloadUrl($key, self::URL_TTL_SECONDS));
        // getContent(false): a 4xx or 5xx answer is not an exception, so its message (with the signed URL) is not shown.
        if (200 !== $download->getStatusCode() || self::TEST_CONTENT !== $download->getContent(false)) {
            return 'The download through a signed URL failed, or the content differs from the uploaded content.';
        }

        return null;
    }
}
