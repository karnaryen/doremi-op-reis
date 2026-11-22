<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\ConfirmRecordingRequest;
use App\Dto\RecordingUploadRequest;
use App\Entity\Assignment;
use App\Entity\RecordingKind;
use App\Entity\User;
use App\Security\Limiter;
use App\Security\Voter\AssignmentVoter;
use App\Service\FileLinks;
use App\Service\RecordingUploads;
use App\View\AssignmentDetailView;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * The recordings of an Assignment. The file never passes through Symfony (docs/tech/architecture.md, "Upload flow"):
 *
 * 1. uploadUrl(): the parent gets a signed URL.
 * 2. The browser sends the file to R2 with HTTP PUT.
 * 3. confirm(): Symfony checks the object in R2 and saves the row.
 */
final class RecordingController extends AbstractController
{
    #[Route('/api/assignments/{id}/recordings/upload-url', name: 'api_recording_upload_url', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted(AssignmentVoter::UPLOAD, 'assignment')]
    public function uploadUrl(Assignment $assignment, #[MapRequestPayload(acceptFormat: 'json')] RecordingUploadRequest $payload, #[CurrentUser] User $parent, RecordingUploads $uploads, Limiter $limiter): JsonResponse
    {
        $limiter->uploadUrl($parent);

        return $this->json($uploads->createUploadUrl($assignment, $payload->kind, $payload->mimeType, $payload->size));
    }

    #[Route('/api/assignments/{id}/recordings', name: 'api_recording_confirm', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted(AssignmentVoter::UPLOAD, 'assignment')]
    public function confirm(Assignment $assignment, #[MapRequestPayload(acceptFormat: 'json')] ConfirmRecordingRequest $payload, RecordingUploads $uploads): JsonResponse
    {
        $uploads->confirm($assignment, $payload->kind, $payload->uploadId);

        return $this->json(AssignmentDetailView::of($assignment));
    }

    /** A link to play the video or the audio, for the teacher and for the parent of this Assignment. */
    #[Route('/api/assignments/{id}/recordings/{kind}/url', name: 'api_recording_download_url', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[IsGranted(AssignmentVoter::VIEW, 'assignment')]
    public function downloadUrl(Assignment $assignment, RecordingKind $kind, FileLinks $links): JsonResponse
    {
        return $this->json($links->forRecording($assignment, $kind));
    }
}
