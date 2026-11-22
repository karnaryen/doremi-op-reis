<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\MaterialUploadRequest;
use App\Entity\Assignment;
use App\Entity\User;
use App\Security\Limiter;
use App\Security\Voter\AssignmentVoter;
use App\Service\FileLinks;
use App\Service\MaterialUploads;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** The files of a piece: sheet music and the audio example. */
final class MaterialFileController extends AbstractController
{
    /**
     * The teacher is going to upload one file in the form "Assign a piece".
     * The answer has an upload id; the form sends the ids with "POST /api/assignments".
     */
    #[Route('/api/material-uploads', name: 'api_material_upload_url', methods: ['POST'])]
    #[IsGranted('ROLE_TEACHER')]
    public function uploadUrl(#[MapRequestPayload(acceptFormat: 'json')] MaterialUploadRequest $payload, #[CurrentUser] User $teacher, MaterialUploads $uploads, Limiter $limiter): JsonResponse
    {
        $limiter->uploadUrl($teacher);

        return $this->json($uploads->createUploadUrl($teacher, $payload->purpose, $payload->mimeType, $payload->size));
    }

    /**
     * A link to open a file of the piece. The file is found through the Assignment:
     * the teacher and every parent with an Assignment for this Material have access (docs/tech/data-model.md).
     */
    #[Route('/api/assignments/{id}/material-files/{fileId}/url', name: 'api_material_file_download_url', requirements: ['id' => '\d+', 'fileId' => '\d+'], methods: ['GET'])]
    #[IsGranted(AssignmentVoter::VIEW, 'assignment')]
    public function downloadUrl(Assignment $assignment, int $fileId, FileLinks $links): JsonResponse
    {
        return $this->json($links->forMaterialFile($assignment, $fileId));
    }
}
