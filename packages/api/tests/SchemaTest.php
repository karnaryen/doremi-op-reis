<?php

declare(strict_types=1);

namespace App\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaValidator;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * The entities and the migrations must describe the same tables.
 * This test fails when an entity was changed and no migration was written for the change:
 * run `bin/console doctrine:migrations:diff` then.
 */
final class SchemaTest extends KernelTestCase
{
    public function testTheMappingIsValidAndTheMigrationsMatchTheEntities(): void
    {
        $validator = new SchemaValidator(self::getContainer()->get(EntityManagerInterface::class));

        self::assertSame([], $validator->validateMapping());
        // Doctrine Migrations keeps its own table in the database. It is not an entity, so it is not a difference.
        $differences = array_filter($validator->getUpdateSchemaList(), static fn (string $sql): bool => !str_contains($sql, 'doctrine_migration_versions'));
        self::assertSame([], array_values($differences), 'The database of the migrations differs from the entities.');
    }
}
