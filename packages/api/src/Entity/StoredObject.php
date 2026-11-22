<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * What the database knows about one file in the storage (Cloudflare R2). The file itself is not in PostgreSQL.
 *
 * An "embeddable" has no table of its own: its fields become columns of the entity that uses it
 * (MaterialFile, Recording). So the four fields are written once.
 *
 * https://www.doctrine-project.org/projects/doctrine-orm/en/current/tutorials/embeddables.html
 */
#[ORM\Embeddable]
final readonly class StoredObject
{
    public function __construct(
        /** The name of the object in the bucket. The server makes it; it never comes from a request. */
        #[ORM\Column(length: 255)]
        public string $objectKey,
        #[ORM\Column(length: 100)]
        public string $mimeType,
        /** Size in bytes. */
        #[ORM\Column(type: Types::INTEGER)]
        public int $size,
        #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
        public \DateTimeImmutable $uploadedAt,
    ) {
    }
}
