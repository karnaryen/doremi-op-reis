<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Student;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Student>
 */
final class StudentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Student::class);
    }

    /**
     * The students of one teacher, with their parents, by name.
     * "JOIN ... addSelect" loads the parents in the same query, so the list needs one query and not one per row.
     *
     * @return list<Student>
     */
    public function findByTeacher(User $teacher): array
    {
        /** @var list<Student> */
        return $this->createQueryBuilder('student')
            ->addSelect('parent')
            ->join('student.parent', 'parent')
            ->where('parent.teacher = :teacher')
            ->setParameter('teacher', $teacher)
            ->orderBy('student.name', 'ASC')
            ->addOrderBy('student.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByParent(User $parent): ?Student
    {
        return $this->findOneBy(['parent' => $parent]);
    }
}
