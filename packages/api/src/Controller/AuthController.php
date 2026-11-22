<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\Profiles;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Sign-in, sign-out and "who am I".
 *
 * Symfony Security does the work before these methods run (config/packages/security.yaml):
 * the "json_login" authenticator checks the email and the password and starts the session,
 * and the "logout" listener ends it.
 *
 * https://symfony.com/doc/current/security.html#json-login
 */
final class AuthController extends AbstractController
{
    /**
     * Body: {"email": "...", "password": "..."}. A wrong password never reaches this method:
     * LoginFailureHandler answers with 401.
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(#[CurrentUser] ?User $user, Profiles $profiles): JsonResponse
    {
        if (null === $user) {
            // The authenticator did not run: the body has no "email" or "password".
            return $this->json(['error' => 'invalid_credentials', 'message' => 'Send the email and the password as JSON.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($profiles->of($user));
    }

    /** Never runs: the logout listener of the firewall answers first (LogoutSubscriber sets the answer). */
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('The firewall handles this route: check "logout" in config/packages/security.yaml.');
    }

    /**
     * The signed-in user, or JSON null for a guest. The SPA asks this at every start, also for a guest:
     * so "nobody is signed in" is a normal answer (200) and not an error (401) in the browser console.
     * It is the only endpoint with data that a guest may call (access_control in config/packages/security.yaml).
     */
    #[Route('/api/profile', name: 'api_profile', methods: ['GET'])]
    public function profile(#[CurrentUser] ?User $user, Profiles $profiles): JsonResponse
    {
        return $this->json(null === $user ? null : $profiles->of($user));
    }
}
