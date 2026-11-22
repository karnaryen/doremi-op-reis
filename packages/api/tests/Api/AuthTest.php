<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\User;
use App\Repository\UserRepository;

/** Teacher sign-up, sign-in, sign-out and the profile. */
final class AuthTest extends ApiTestCase
{
    public function testATeacherSignsUpAndIsSignedIn(): void
    {
        $this->post('/api/teachers', ['name' => ' Tessa Teacher ', 'email' => 'Tessa@Example.test', 'password' => self::PASSWORD]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Tessa Teacher', $this->json('name'));
        self::assertSame('tessa@example.test', $this->json('email'));
        self::assertSame('teacher', $this->json('role'));
        self::assertNull($this->json('childName'));

        $saved = static::getContainer()->get(UserRepository::class)->findOneByEmail('tessa@example.test');
        self::assertInstanceOf(User::class, $saved);
        self::assertNotSame(self::PASSWORD, $saved->getPassword(), 'The database has a hash, never the password.');

        // The answer has set the session cookie: the next request is from the signed-in teacher.
        $this->get('/api/profile');
        self::assertResponseIsSuccessful();
        self::assertSame('tessa@example.test', $this->json('email'));
    }

    public function testSignUpRefusesAnEmailThatIsTaken(): void
    {
        $this->createTeacher('tessa@example.test');

        $this->post('/api/teachers', ['name' => 'Other', 'email' => 'TESSA@example.test', 'password' => self::PASSWORD]);

        $this->assertError(409, 'email_already_used');
    }

    public function testSignUpNamesTheInvalidFields(): void
    {
        $this->post('/api/teachers', ['name' => 'Visit evil.example', 'email' => 'not-an-email', 'password' => 'short']);

        $this->assertError(422, 'validation_failed');
        $fields = array_column($this->jsonList('violations'), 'field');
        sort($fields);
        self::assertSame(['email', 'name', 'password'], $fields);
    }

    public function testSignUpIsLimitedPerIpAddress(): void
    {
        for ($i = 1; $i <= 5; ++$i) {
            $this->post('/api/teachers', ['name' => 'T', 'email' => "t$i@example.test", 'password' => self::PASSWORD]);
            self::assertResponseStatusCodeSame(201);
        }

        $this->post('/api/teachers', ['name' => 'T', 'email' => 't6@example.test', 'password' => self::PASSWORD]);

        $this->assertError(429, 'too_many_requests');
        self::assertResponseHasHeader('Retry-After');
    }

    public function testSignInWithEmailAndPassword(): void
    {
        $this->createTeacher('tessa@example.test');

        // The email is not case-sensitive.
        $this->post('/api/login', ['email' => 'Tessa@Example.test', 'password' => self::PASSWORD]);

        self::assertResponseIsSuccessful();
        self::assertSame('teacher', $this->json('role'));
        self::assertResponseHasCookie('REMEMBERME');

        $this->get('/api/profile');
        self::assertResponseIsSuccessful();
    }

    public function testAParentProfileHasTheNameOfTheChild(): void
    {
        $this->createStudent($this->createTeacher(), 'paula@example.test', 'Charlie');

        $this->post('/api/login', ['email' => 'paula@example.test', 'password' => self::PASSWORD]);

        self::assertResponseIsSuccessful();
        self::assertSame('parent', $this->json('role'));
        self::assertSame('Charlie', $this->json('childName'));
    }

    public function testAWrongPasswordAndAnUnknownEmailGetTheSameAnswer(): void
    {
        $this->createTeacher('tessa@example.test');

        $this->post('/api/login', ['email' => 'tessa@example.test', 'password' => 'wrong password']);
        $this->assertError(401, 'invalid_credentials');
        $wrongPassword = $this->client->getResponse()->getContent();

        $this->post('/api/login', ['email' => 'nobody@example.test', 'password' => 'wrong password']);
        $this->assertError(401, 'invalid_credentials');

        // The answer must not say which emails have an account.
        self::assertSame($wrongPassword, $this->client->getResponse()->getContent());
    }

    public function testSignInWithoutEmailAndPasswordFails(): void
    {
        $this->post('/api/login', ['user' => 'tessa@example.test']);

        self::assertResponseStatusCodeSame(400);
    }

    public function testFailedSignInsAreLimited(): void
    {
        $this->createTeacher('tessa@example.test');

        for ($i = 1; $i <= 5; ++$i) {
            $this->post('/api/login', ['email' => 'tessa@example.test', 'password' => 'wrong password']);
            $this->assertError(401, 'invalid_credentials');
        }

        // Also the right password is refused now, until the minute is over.
        $this->post('/api/login', ['email' => 'tessa@example.test', 'password' => self::PASSWORD]);

        $this->assertError(429, 'too_many_attempts');
    }

    public function testSignOutEndsTheSession(): void
    {
        $this->client->loginUser($this->createTeacher());
        $this->get('/api/profile');
        self::assertResponseIsSuccessful();

        $this->post('/api/logout');
        self::assertResponseStatusCodeSame(204);

        $this->get('/api/profile');
        self::assertResponseIsSuccessful();
        self::assertNull($this->json());

        // Every other endpoint with data needs a signed-in user again.
        $this->get('/api/students');
        $this->assertError(401, 'unauthorized');
    }

    public function testTheRememberMeCookieSignsTheUserInAgainWhenTheSessionIsGone(): void
    {
        $this->createTeacher('tessa@example.test');
        $this->post('/api/login', ['email' => 'tessa@example.test', 'password' => self::PASSWORD]);
        self::assertResponseHasCookie('REMEMBERME');

        // A deploy or a restart of the server deletes the session files: the browser still sends both cookies,
        // but the session id is unknown to the server. Here the browser forgets the session cookie.
        $this->client->getCookieJar()->expire('MOCKSESSID');
        $this->get('/api/students');

        self::assertResponseIsSuccessful();
    }

    public function testSignOutAlsoRemovesTheRememberMeCookie(): void
    {
        $this->createTeacher('tessa@example.test');
        $this->post('/api/login', ['email' => 'tessa@example.test', 'password' => self::PASSWORD]);

        $this->post('/api/logout');
        self::assertResponseStatusCodeSame(204);

        self::assertNull($this->client->getCookieJar()->get('REMEMBERME'));
        $this->client->getCookieJar()->expire('MOCKSESSID');
        $this->get('/api/students');
        $this->assertError(401, 'unauthorized');
    }

    public function testSpacesAroundTheEmailAreNotAnotherWayIntoTheSameAccount(): void
    {
        $this->createTeacher('tessa@example.test');

        // The limiter counts failed sign-ins per typed email. If " tessa@..." found the account of "tessa@...",
        // every variant with spaces would get its own five tries.
        $this->post('/api/login', ['email' => ' tessa@example.test', 'password' => self::PASSWORD]);

        $this->assertError(401, 'invalid_credentials');
    }

    public function testSignOutNeedsAPostRequest(): void
    {
        $this->client->loginUser($this->createTeacher());

        // A link or an image on another website can only make a GET request.
        $this->get('/api/logout');

        $this->assertError(405, 'method_not_allowed');
    }

    public function testTheProfileOfAGuestIsNull(): void
    {
        $this->get('/api/profile');

        // 200 and not 401: the SPA asks this at every start, and "nobody is signed in" is not an error.
        self::assertResponseIsSuccessful();
        self::assertNull($this->json());
    }

    public function testAGuestCannotReadData(): void
    {
        foreach (['/api/students', '/api/assignments', '/api/assignments/1', '/api/students/1'] as $url) {
            $this->get($url);
            $this->assertError(401, 'unauthorized');
        }
    }

    public function testARequestThatChangesDataMustBeJson(): void
    {
        $this->client->loginUser($this->createTeacher());

        // What an HTML form on another website can send: no JSON content type.
        $this->client->request('POST', '/api/parents', ['name' => 'Paula', 'email' => 'paula@example.test', 'childName' => 'Charlie']);
        $this->assertError(415, 'unsupported_media_type');

        $this->client->request('POST', '/api/logout');
        $this->assertError(415, 'unsupported_media_type');
    }

    public function testAnUnknownApiUrlGetsAJsonAnswer(): void
    {
        $this->client->loginUser($this->createTeacher());

        $this->get('/api/does-not-exist');

        $this->assertError(404, 'not_found');
        self::assertResponseHeaderSame('Content-Type', 'application/json');
    }
}
