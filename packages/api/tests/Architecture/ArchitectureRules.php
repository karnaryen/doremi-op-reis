<?php

namespace App\Tests\Architecture;

use PHPat\Selector\Selector;
use PHPat\Test\Builder\Rule;
use PHPat\Test\PHPat;

/**
 * Which part of the API may use which. PHPStan checks these rules (`pnpm nx run api:phpstan`):
 * the PHPat extension reads every public method here whose name starts with "test".
 *
 * This is not a PHPUnit test, so the file name does not end with "Test".
 * A "dependency" is every use of a class: a parameter, a return type, `new`, `extends`, `implements`,
 * an attribute, a type in a doc comment.
 *
 * https://github.com/carlosas/phpat
 */
final class ArchitectureRules
{
    /**
     * Features ask for the ObjectStorage interface. Then a change of the SDK or of the storage service
     * touches only App\Storage, and tests can replace the storage with a fake.
     */
    public function testOnlyStorageUsesTheAwsSdk(): Rule
    {
        return PHPat::rule()
            ->classes(Selector::inNamespace('App'))
            ->excluding(Selector::inNamespace('App\Storage'), Selector::inNamespace('App\Tests'))
            ->shouldNotDependOn()
            ->classes(Selector::inNamespace('Aws'))
            ->because('only App\Storage talks to the AWS SDK: use the App\Storage\ObjectStorage interface');
    }

    /**
     * The storage saves and deletes objects. It does not know what a recording or a student is.
     */
    public function testStorageDoesNotKnowTheRestOfTheApp(): Rule
    {
        return PHPat::rule()
            ->classes(Selector::inNamespace('App\Storage'))
            ->shouldNotDependOn()
            ->classes(Selector::inNamespace('App'))
            ->excluding(Selector::inNamespace('App\Storage'))
            ->because('App\Storage is used by features, it does not use them');
    }

    /**
     * A controller reads the request and builds the response. Queries and saving belong to
     * a service or a repository (docs/learning-guide.md: no SQL and business rules in a controller).
     */
    public function testControllersDoNotUseDoctrine(): Rule
    {
        return PHPat::rule()
            ->classes(Selector::inNamespace('App\Controller'))
            ->shouldNotDependOn()
            ->classes(Selector::inNamespace('Doctrine'))
            ->because('a controller calls a service or a repository, not Doctrine');
    }

    /**
     * An entity holds data and the rules of its own state. It does not send emails, call the storage
     * or build JSON: a service or a view does that with the entity.
     */
    public function testEntitiesDoNotKnowServicesControllersOrViews(): Rule
    {
        return PHPat::rule()
            ->classes(Selector::inNamespace('App\Entity'))
            ->shouldNotDependOn()
            ->classes(
                Selector::inNamespace('App\Service'),
                Selector::inNamespace('App\Controller'),
                Selector::inNamespace('App\View'),
                Selector::inNamespace('App\Dto'),
                Selector::inNamespace('App\Upload'),
                Selector::inNamespace('App\Storage'),
            )
            ->because('entities are the centre of the app: other code uses them, they use no other layer');
    }

    /**
     * The data path has one direction: Controller → Service → Repository. A service that needs a controller,
     * or a repository that needs a service, turns the path into a circle.
     */
    public function testServicesAndRepositoriesDoNotUseControllers(): Rule
    {
        return PHPat::rule()
            ->classes(Selector::inNamespace('App\Service'), Selector::inNamespace('App\Repository'), Selector::inNamespace('App\Upload'))
            ->shouldNotDependOn()
            ->classes(Selector::inNamespace('App\Controller'))
            ->because('the data path is Controller → Service → Repository, never back');
    }
}
