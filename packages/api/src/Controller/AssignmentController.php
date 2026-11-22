<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\CreateAssignmentRequest;
use App\Dto\ReviewRequest;
use App\Entity\Assignment;
use App\Entity\User;
use App\Repository\AssignmentFilter;
use App\Repository\AssignmentRepository;
use App\Security\Voter\AssignmentVoter;
use App\Service\Assignments;
use App\View\AssignmentDetailView;
use App\View\AssignmentSummaryView;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Assignments ("piece cards") for both roles.
 *
 * The data path of a request, for example "POST /api/assignments/7/review":
 * router → firewall (is the user signed in?) → Symfony loads Assignment 7 → AssignmentVoter (is it an Assignment
 * of this teacher?) → #[MapRequestPayload] (is the body valid?) → this controller → the service Assignments
 * (the rules) → the entity → Doctrine → PostgreSQL → JSON.
 */
final class AssignmentController extends AbstractController
{
    /**
     * The tabs of "Main": ?filter=to_review, active or completed. A wrong value is 400.
     * A teacher gets the Assignments of the own students, a parent those of the own child:
     * the repository always gets the signed-in user, never an id from the request.
     */
    #[Route('/api/assignments', name: 'api_assignment_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user, AssignmentRepository $assignments, #[MapQueryParameter(validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] AssignmentFilter $filter = AssignmentFilter::Active): JsonResponse
    {
        $list = match (true) {
            $user->isTeacher() => $assignments->findForTeacher($user, $filter),
            // "To review" is a tab of the teacher only.
            AssignmentFilter::ToReview === $filter => throw $this->createAccessDeniedException(),
            default => $assignments->findForParent($user, $filter),
        };

        return $this->json(array_map(AssignmentSummaryView::of(...), $list));
    }

    #[Route('/api/assignments', name: 'api_assignment_create', methods: ['POST'])]
    #[IsGranted('ROLE_TEACHER')]
    public function create(#[MapRequestPayload(acceptFormat: 'json')] CreateAssignmentRequest $payload, #[CurrentUser] User $teacher, Assignments $assignments): JsonResponse
    {
        return $this->json(AssignmentDetailView::of($assignments->create($teacher, $payload)), Response::HTTP_CREATED);
    }

    #[Route('/api/assignments/{id}', name: 'api_assignment_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[IsGranted(AssignmentVoter::VIEW, 'assignment')]
    public function show(Assignment $assignment): JsonResponse
    {
        return $this->json(AssignmentDetailView::of($assignment));
    }

    /** Body: {"action": "complete" | "try_again", "feedback": "...", "version": 3}. */
    #[Route('/api/assignments/{id}/review', name: 'api_assignment_review', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted(AssignmentVoter::REVIEW, 'assignment')]
    public function review(Assignment $assignment, #[MapRequestPayload(acceptFormat: 'json')] ReviewRequest $payload, Assignments $assignments): JsonResponse
    {
        $assignments->review($assignment, $payload->action, $payload->feedback, $payload->version);

        return $this->json(AssignmentDetailView::of($assignment));
    }
}
