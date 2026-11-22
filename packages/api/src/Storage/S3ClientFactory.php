<?php

declare(strict_types=1);

namespace App\Storage;

use Aws\S3\S3Client;
use Aws\S3\S3ClientInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Builds the AWS SDK client for Cloudflare R2. R2 has the S3 API, so the S3 client works
 * with the R2 endpoint: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-php/
 *
 * config/services.yaml registers the result of create() as the S3ClientInterface service.
 */
final readonly class S3ClientFactory
{
    public function __construct(
        #[Autowire(env: 'R2_ENDPOINT')]
        private string $endpoint,
        #[Autowire(env: 'R2_ACCESS_KEY_ID')]
        private string $accessKeyId,
        #[Autowire(env: 'R2_SECRET_ACCESS_KEY')]
        #[\SensitiveParameter]
        private string $secretAccessKey,
    ) {
    }

    public function create(): S3ClientInterface
    {
        // Without this check the SDK would take an empty endpoint as "use Amazon S3".
        if ('' === $this->endpoint || '' === $this->accessKeyId || '' === $this->secretAccessKey) {
            throw StorageException::notConfigured();
        }

        // Signed URLs start with the endpoint, and browsers send the files of children to them: HTTPS only.
        // An endpoint without "https://" would also make the SDK fail later, with an error of its own.
        $url = parse_url($this->endpoint);
        if (false === $url || 'https' !== ($url['scheme'] ?? null) || '' === ($url['host'] ?? '')) {
            throw new StorageException('R2_ENDPOINT must be a URL that starts with https://, for example https://<ACCOUNT_ID>.r2.cloudflarestorage.com.');
        }

        return new S3Client([
            // R2 has one region name: https://developers.cloudflare.com/r2/api/s3/api/
            'region' => 'auto',
            'endpoint' => $this->endpoint,
            'credentials' => [
                'key' => $this->accessKeyId,
                'secret' => $this->secretAccessKey,
            ],
        ]);
    }
}
