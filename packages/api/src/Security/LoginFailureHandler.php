<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * The answer to a failed sign-in, in the same JSON shape as all other errors of the API.
 *
 * One answer for "no such email", "wrong password" and "no password yet":
 * the answer does not say which emails have an account.
 */
final readonly class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): JsonResponse
    {
        if ($exception instanceof TooManyLoginAttemptsAuthenticationException) {
            return new JsonResponse(
                ['error' => 'too_many_attempts', 'message' => 'Too many failed sign-in attempts. Try again in a few minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS,
            );
        }

        return new JsonResponse(
            ['error' => 'invalid_credentials', 'message' => 'The email or the password is wrong.'],
            Response::HTTP_UNAUTHORIZED,
        );
    }
}
