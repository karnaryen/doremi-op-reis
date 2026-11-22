<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\AcceptInvitationRequest;
use App\Dto\SignUpRequest;
use App\Entity\User;
use App\Security\Limiter;
use App\Service\Invitations;
use App\Service\Profiles;
use App\Service\TeacherSignUp;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;

/**
 * The two ways to get a password: a teacher signs up, a parent accepts an invitation.
 * Both are open to guests (see access_control in config/packages/security.yaml), and both sign the user in.
 */
final class SignUpController extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly Profiles $profiles,
        private readonly Limiter $limiter,
    ) {
    }

    #[Route('/api/teachers', name: 'api_teacher_sign_up', methods: ['POST'])]
    public function signUp(#[MapRequestPayload(acceptFormat: 'json')] SignUpRequest $payload, Request $request, TeacherSignUp $signUp): JsonResponse
    {
        // At most 5 sign-ups per hour from one IP address.
        $this->limiter->signUp($request->getClientIp());

        return $this->signIn($signUp->signUp($payload), Response::HTTP_CREATED);
    }

    #[Route('/api/invitations/accept', name: 'api_invitation_accept', methods: ['POST'])]
    public function acceptInvitation(#[MapRequestPayload(acceptFormat: 'json')] AcceptInvitationRequest $payload, Invitations $invitations): JsonResponse
    {
        // No limiter here: the token has 64 random hex characters, nobody can guess it.
        return $this->signIn($invitations->accept($payload->token, $payload->password), Response::HTTP_OK);
    }

    /** Starts the session, as "json_login" does after a sign-in with a password. */
    private function signIn(User $user, int $status): JsonResponse
    {
        $this->security->login($user, 'json_login', 'main', [(new RememberMeBadge())->enable()]);

        return $this->json($this->profiles->of($user), $status);
    }
}
