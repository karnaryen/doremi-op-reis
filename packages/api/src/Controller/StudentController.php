<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Student;
use App\Entity\User;
use App\Repository\AssignmentRepository;
use App\Repository\StudentRepository;
use App\Security\Voter\StudentVoter;
use App\View\StudentView;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * The section "Students" of the teacher. These endpoints only read, so they call the repositories directly:
 * a service that only passes the call on would add nothing.
 */
#[IsGranted('ROLE_TEACHER')]
final class StudentController extends AbstractController
{
    #[Route('/api/students', name: 'api_student_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $teacher, StudentRepository $students): JsonResponse
    {
        return $this->json(array_map(StudentView::of(...), $students->findByTeacher($teacher)));
    }

    /** One student with all Assignments. */
    #[Route('/api/students/{id}', name: 'api_student_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[IsGranted(StudentVoter::VIEW, 'student')]
    public function show(Student $student, AssignmentRepository $assignments): JsonResponse
    {
        return $this->json(StudentView::withAssignments($student, $assignments->findForStudent($student)));
    }
}
