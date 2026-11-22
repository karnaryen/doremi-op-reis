<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Assignment;
use App\Entity\AssignmentStatus;
use App\Entity\Recording;
use App\Entity\Student;
use App\Entity\SubmissionStatus;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Queries for Assignments. Every list method takes the owner (teacher, parent or student) as an argument,
 * so a list can never contain the data of another family.
 *
 * @extends ServiceEntityRepository<Assignment>
 */
final class AssignmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Assignment::class);
    }

    /** @return list<Assignment> */
    public function findForTeacher(User $teacher, AssignmentFilter $filter): array
    {
        $query = $this->listQuery($filter)
            ->andWhere('parent.teacher = :teacher')
            ->setParameter('teacher', $teacher);

        /** @var list<Assignment> */
        return $query->getQuery()->getResult();
    }

    /** @return list<Assignment> */
    public function findForParent(User $parent, AssignmentFilter $filter): array
    {
        $query = $this->listQuery($filter)
            ->andWhere('student.parent = :parent')
            ->setParameter('parent', $parent);

        /** @var list<Assignment> */
        return $query->getQuery()->getResult();
    }

    /**
     * All Assignments of one student: active first, then completed.
     *
     * @return list<Assignment>
     */
    public function findForStudent(Student $student): array
    {
        $query = $this->baseQuery()
            ->andWhere('assignment.student = :student')
            ->setParameter('student', $student)
            ->orderBy('assignment.status', 'ASC')
            ->addOrderBy('assignment.createdAt', 'DESC')
            ->addOrderBy('assignment.id', 'DESC');

        /** @var list<Assignment> */
        return $query->getQuery()->getResult();
    }

    /**
     * The storage keys of all recordings of one family. Read them before the parent is deleted:
     * the database deletes the Recording rows together with the parent (ON DELETE CASCADE).
     *
     * @return list<string>
     */
    public function findRecordingKeysOfParent(User $parent): array
    {
        /** @var list<string> */
        return $this->getEntityManager()->createQueryBuilder()
            ->select('recording.file.objectKey')
            ->from(Recording::class, 'recording')
            ->join('recording.submission', 'submission')
            ->join('submission.assignment', 'assignment')
            ->join('assignment.student', 'student')
            ->where('student.parent = :parent')
            ->setParameter('parent', $parent)
            ->getQuery()
            ->getSingleColumnResult();
    }

    /**
     * The ids of all Assignments of one family. Read them before the parent is deleted, like the keys above.
     *
     * @return list<int>
     */
    public function findIdsOfParent(User $parent): array
    {
        /** @var list<int> */
        return $this->createQueryBuilder('assignment')
            ->select('assignment.id')
            ->join('assignment.student', 'student')
            ->where('student.parent = :parent')
            ->setParameter('parent', $parent)
            ->getQuery()
            ->getSingleColumnResult();
    }

    /**
     * An Assignment with everything a list row shows. The joins load the related rows in the same query:
     * without them Doctrine would send one more query per row and relation (the "N+1 queries" problem).
     */
    private function baseQuery(): QueryBuilder
    {
        return $this->createQueryBuilder('assignment')
            ->addSelect('student', 'parent', 'material', 'submission', 'feedback')
            ->join('assignment.student', 'student')
            ->join('student.parent', 'parent')
            ->join('assignment.material', 'material')
            ->leftJoin('assignment.submission', 'submission')
            ->leftJoin('assignment.feedback', 'feedback');
    }

    private function listQuery(AssignmentFilter $filter): QueryBuilder
    {
        $query = $this->baseQuery()->andWhere('assignment.status = :status');

        return match ($filter) {
            // The recording that waits longest comes first.
            AssignmentFilter::ToReview => $query
                ->setParameter('status', AssignmentStatus::Active)
                ->andWhere('submission.status = :pending')
                ->setParameter('pending', SubmissionStatus::PendingReview)
                ->orderBy('submission.submittedAt', 'ASC')
                ->addOrderBy('assignment.id', 'ASC'),
            AssignmentFilter::Active => $query
                ->setParameter('status', AssignmentStatus::Active)
                ->orderBy('assignment.createdAt', 'DESC')
                ->addOrderBy('assignment.id', 'DESC'),
            AssignmentFilter::Completed => $query
                ->setParameter('status', AssignmentStatus::Completed)
                ->orderBy('assignment.completedAt', 'DESC')
                ->addOrderBy('assignment.id', 'DESC'),
        };
    }
}
