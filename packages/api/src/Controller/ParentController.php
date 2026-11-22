<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\AddParentRequest;
use App\Entity\User;
use App\Security\Limiter;
use App\Security\Voter\ParentAccountVoter;
use App\Service\ParentAccounts;
use App\View\StudentView;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * The parent accounts of the signed-in teacher.
 *
 * Two checks: the role on the class (only a teacher), and for a request about one parent the object,
 * with ParentAccountVoter (is it a parent of this teacher?).
 * Symfony loads the parent from the {id} of the URL; an unknown id is 404.
 */
#[IsGranted('ROLE_TEACHER')]
final class ParentController extends AbstractController
{
    public function __construct(
        private readonly ParentAccounts $parents,
        private readonly Limiter $limiter,
    ) {
    }

    #[Route('/api/parents', name: 'api_parent_add', methods: ['POST'])]
    public function add(#[MapRequestPayload(acceptFormat: 'json')] AddParentRequest $payload, #[CurrentUser] User $teacher): JsonResponse
    {
        $this->limiter->invitationEmail($teacher);
        $invited = $this->parents->add($teacher, $payload);

        return $this->json(StudentView::of($invited->student, $invited->invitationSent), Response::HTTP_CREATED);
    }

    #[Route('/api/parents/{id}/invitation', name: 'api_parent_invite_again', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted(ParentAccountVoter::MANAGE, 'parent')]
    public function inviteAgain(User $parent, #[CurrentUser] User $teacher): JsonResponse
    {
        $this->limiter->invitationEmail($teacher);
        $invited = $this->parents->inviteAgain($teacher, $parent);

        return $this->json(StudentView::of($invited->student, $invited->invitationSent));
    }

    #[Route('/api/parents/{id}', name: 'api_parent_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted(ParentAccountVoter::MANAGE, 'parent')]
    public function delete(User $parent): Response
    {
        $this->parents->delete($parent);

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
