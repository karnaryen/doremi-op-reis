<?php

declare(strict_types=1);

namespace App\Tests\Api;

/** The section "Students": a teacher sees only the own students. */
final class StudentTest extends ApiTestCase
{
    public function testATeacherSeesOnlyTheOwnStudents(): void
    {
        $teacher = $this->createTeacher('first@example.test');
        $this->createStudent($teacher, 'zoe@example.test', 'Zoe');
        $this->createStudent($teacher, 'adam@example.test', 'Adam');
        $this->createStudent($this->createTeacher('second@example.test'), 'other@example.test', 'Other child');
        $this->client->loginUser($teacher);

        $this->get('/api/students');

        self::assertResponseIsSuccessful();
        self::assertSame(['Adam', 'Zoe'], array_column($this->jsonList(), 'name'));
        self::assertSame('adam@example.test', $this->json('0.parent.email'));
        self::assertFalse($this->json('0.parent.invitationPending'));
    }

    public function testTheStudentScreenHasAllAssignmentsOfTheStudent(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher);
        $this->createAssignment($student, 'Minuet in G');
        $completed = $this->createAssignment($student, 'Ode to Joy');
        $completed->complete('Well done!', new \DateTimeImmutable(self::NOW));
        $this->entityManager()->flush();
        $this->client->loginUser($teacher);

        $this->get("/api/students/{$student->getId()}");

        self::assertResponseIsSuccessful();
        self::assertSame('Charlie', $this->json('name'));
        self::assertSame(['Minuet in G', 'Ode to Joy'], array_column($this->jsonList('assignments'), 'title'));
        self::assertSame(['in_progress', 'completed'], array_column($this->jsonList('assignments'), 'status'));
    }

    public function testATeacherCannotOpenTheStudentOfAnotherTeacher(): void
    {
        $student = $this->createStudent($this->createTeacher('first@example.test'));
        $this->client->loginUser($this->createTeacher('second@example.test'));

        $this->get("/api/students/{$student->getId()}");

        $this->assertError(403, 'forbidden');
    }

    public function testAParentAndAGuestCannotOpenTheStudentsSection(): void
    {
        $student = $this->createStudent($this->createTeacher());

        $this->get('/api/students');
        $this->assertError(401, 'unauthorized');

        $this->client->loginUser($student->getParent());
        $this->get('/api/students');
        $this->assertError(403, 'forbidden');
        $this->get("/api/students/{$student->getId()}");
        $this->assertError(403, 'forbidden');
    }

    public function testAnUnknownStudentIsNotFound(): void
    {
        $this->client->loginUser($this->createTeacher());

        $this->get('/api/students/999999');

        $this->assertError(404, 'not_found');
    }
}
