<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Assignment;
use App\Entity\RecordingKind;
use App\Entity\User;
use App\Service\MaterialUploads;

/** Assign a piece, the lists of "Main", the piece card and the review. */
final class AssignmentTest extends ApiTestCase
{
    public function testATeacherAssignsAPieceWithFiles(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher);
        $this->client->loginUser($teacher);
        $page1 = $this->uploadMaterial($teacher, 'sheet_music', 'image/jpeg');
        $page2 = $this->uploadMaterial($teacher, 'sheet_music', 'image/png');
        $audio = $this->uploadMaterial($teacher, 'audio_example', 'audio/mpeg');

        $this->post('/api/assignments', [
            'studentId' => $student->getId(),
            'title' => ' Minuet in G ',
            'generalInstruction' => 'Play slowly.',
            'personalInstruction' => '  ',
            'parentHint' => 'Count aloud together.',
            'sheetMusicUploadIds' => [$page1, $page2],
            'audioExampleUploadId' => $audio,
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Minuet in G', $this->json('title'));
        self::assertSame('in_progress', $this->json('status'));
        self::assertSame('Charlie', $this->json('studentName'));
        self::assertSame('Play slowly.', $this->json('generalInstruction'));
        self::assertNull($this->json('personalInstruction'), 'An instruction of spaces only is no instruction.');
        self::assertSame(
            [['sheet_music', 'image/jpeg', 1], ['sheet_music', 'image/png', 2], ['audio_example', 'audio/mpeg', null]],
            array_map(static fn (mixed $file): array => \is_array($file) ? [$file['purpose'], $file['mimeType'], $file['position']] : [], $this->jsonList('materialFiles')),
        );

        // Three files under their final keys; the temporary uploads are gone.
        $keys = $this->storage()->keys();
        self::assertCount(3, $keys);
        foreach ($keys as $key) {
            self::assertMatchesRegularExpression('#^materials/[0-9a-f]{32}$#', $key);
        }
    }

    public function testAPieceNeedsNoFilesAndNoInstructions(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher);
        $this->client->loginUser($teacher);

        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Scales']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame([], $this->json('materialFiles'));
        self::assertNull($this->json('generalInstruction'));
    }

    public function testSheetMusicIsOnePdfOrImagesNotBoth(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher);
        $this->client->loginUser($teacher);
        $pdf = $this->uploadMaterial($teacher, 'sheet_music', 'application/pdf');
        $image = $this->uploadMaterial($teacher, 'sheet_music', 'image/jpeg');

        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Minuet', 'sheetMusicUploadIds' => [$pdf, $image]]);

        $this->assertError(422, 'file_not_accepted');
        self::assertSame(0, $this->entityManager()->getConnection()->fetchOne('SELECT COUNT(*) FROM material'));
        // The copies are deleted; the uploads stay until their URL expires, so the teacher can send the form again.
        foreach ($this->storage()->keys() as $key) {
            self::assertStringStartsWith('uploads/', $key);
        }
    }

    public function testAnUploadOfAnotherTeacherCannotBeUsed(): void
    {
        $teacher = $this->createTeacher('first@example.test');
        $student = $this->createStudent($teacher);
        $foreignUpload = $this->uploadMaterial($this->createTeacher('second@example.test'), 'sheet_music', 'application/pdf');
        $this->client->loginUser($teacher);

        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Minuet', 'sheetMusicUploadIds' => [$foreignUpload]]);

        $this->assertError(422, 'upload_not_found');
    }

    public function testATeacherCannotAssignToTheStudentOfAnotherTeacher(): void
    {
        $student = $this->createStudent($this->createTeacher('first@example.test'));
        $this->client->loginUser($this->createTeacher('second@example.test'));

        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Minuet']);

        $this->assertError(422, 'student_not_found');
    }

    public function testAParentCannotAssignAPieceOrAskForAMaterialUpload(): void
    {
        $student = $this->createStudent($this->createTeacher());
        $this->client->loginUser($student->getParent());

        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Minuet']);
        $this->assertError(403, 'forbidden');

        $this->post('/api/material-uploads', ['purpose' => 'sheet_music', 'mimeType' => 'application/pdf', 'size' => 100]);
        $this->assertError(403, 'forbidden');
    }

    public function testTheMaterialUploadUrlRefusesOtherFileTypes(): void
    {
        $this->client->loginUser($this->createTeacher());

        $this->post('/api/material-uploads', ['purpose' => 'sheet_music', 'mimeType' => 'image/heic', 'size' => 100]);
        $this->assertError(422, 'file_not_accepted');

        // A browser sends an empty type for a file it does not know.
        $this->post('/api/material-uploads', ['purpose' => 'sheet_music', 'mimeType' => '', 'size' => 100]);
        $this->assertError(422, 'file_not_accepted');

        $this->post('/api/material-uploads', ['purpose' => 'poster', 'mimeType' => 'image/png', 'size' => 100]);
        $this->assertError(422, 'validation_failed');
    }

    public function testSheetMusicHasAtMostTenPages(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher);
        $this->client->loginUser($teacher);
        $uploadIds = array_map(fn (): string => $this->uploadMaterial($teacher, 'sheet_music', 'image/jpeg'), range(1, 11));

        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Sonata', 'sheetMusicUploadIds' => $uploadIds]);

        $this->assertError(422, 'validation_failed');
        self::assertSame('sheetMusicUploadIds', $this->json('violations.0.field'));
    }

    public function testUploadUrlsAreLimitedPerUser(): void
    {
        $this->client->loginUser($this->createTeacher());
        $body = ['purpose' => 'sheet_music', 'mimeType' => 'application/pdf', 'size' => 100];

        for ($i = 1; $i <= 60; ++$i) {
            $this->post('/api/material-uploads', $body);
            self::assertResponseIsSuccessful();
        }

        $this->post('/api/material-uploads', $body);

        $this->assertError(429, 'too_many_requests');
    }

    public function testTheTabsOfTheTeacherShowOnlyTheOwnStudents(): void
    {
        $teacher = $this->createTeacher('first@example.test');
        $student = $this->createStudent($teacher, 'p1@example.test');
        $this->createAssignment($student, 'In progress');
        $this->addRecording($this->createAssignment($student, 'Sent'));
        $tryAgain = $this->createAssignment($student, 'Try again');
        $this->addRecording($tryAgain, RecordingKind::Video, 'recordings/try-again');
        $tryAgain->askToTryAgain('Slower.', new \DateTimeImmutable(self::NOW));
        $this->createAssignment($student, 'Completed')->complete('Done.', new \DateTimeImmutable(self::NOW));
        $this->entityManager()->flush();
        $this->addRecording($this->createAssignment($this->createStudent($this->createTeacher('second@example.test'), 'p2@example.test'), 'Of another teacher'), RecordingKind::Video, 'recordings/other');
        $this->client->loginUser($teacher);

        $this->get('/api/assignments?filter=to_review');
        self::assertSame(['Sent'], array_column($this->jsonList(), 'title'));
        self::assertSame('sent', $this->json('0.status'));

        $this->get('/api/assignments?filter=active');
        $titles = array_column($this->jsonList(), 'title');
        sort($titles);
        self::assertSame(['In progress', 'Sent', 'Try again'], $titles);

        $this->get('/api/assignments?filter=completed');
        self::assertSame(['Completed'], array_column($this->jsonList(), 'title'));
        self::assertSame('2026-12-22T10:00:00+00:00', $this->json('0.deleteAt'));
    }

    public function testAParentSeesOnlyTheAssignmentsOfTheOwnChild(): void
    {
        $teacher = $this->createTeacher();
        $student = $this->createStudent($teacher, 'p1@example.test');
        $this->createAssignment($student, 'Mine');
        $this->createAssignment($this->createStudent($teacher, 'p2@example.test', 'Other child'), 'Of another family');
        $this->client->loginUser($student->getParent());

        $this->get('/api/assignments');
        self::assertSame(['Mine'], array_column($this->jsonList(), 'title'));

        // "To review" is a tab of the teacher.
        $this->get('/api/assignments?filter=to_review');
        $this->assertError(403, 'forbidden');

        $this->get('/api/assignments?filter=archive');
        $this->assertError(400, 'bad_request');
    }

    public function testThePieceCardIsOpenToTheTeacherAndTheParentOfTheStudentOnly(): void
    {
        $teacher = $this->createTeacher('first@example.test');
        $student = $this->createStudent($teacher, 'p1@example.test');
        $assignment = $this->createAssignment($student);
        $otherParent = $this->createStudent($teacher, 'p2@example.test')->getParent();
        $otherTeacher = $this->createTeacher('second@example.test');
        $url = "/api/assignments/{$assignment->getId()}";

        $this->get($url);
        $this->assertError(401, 'unauthorized');

        foreach ([[$teacher, 200], [$student->getParent(), 200], [$otherParent, 403], [$otherTeacher, 403]] as [$user, $status]) {
            $this->client->loginUser($user);
            $this->get($url);
            self::assertResponseStatusCodeSame($status, $user->getEmail());
        }
    }

    public function testThePieceCardHasTheThreeTexts(): void
    {
        $student = $this->createStudent($this->createTeacher());
        $assignment = $this->createAssignment($student);
        $this->client->loginUser($student->getParent());

        $this->get("/api/assignments/{$assignment->getId()}");

        self::assertSame('Play slowly.', $this->json('generalInstruction'));
        self::assertSame('Watch the left hand.', $this->json('personalInstruction'));
        self::assertSame('Count aloud together.', $this->json('parentHint'));
        self::assertNull($this->json('feedback'));
        self::assertSame([], $this->json('recordings'));
    }

    public function testAskToTryAgainSavesTheFeedback(): void
    {
        [$teacher, $assignment] = $this->assignmentWithRecording();
        $this->client->loginUser($teacher);

        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'try_again', 'feedback' => ' Slower, please. ', 'version' => $assignment->getVersion()]);

        self::assertResponseIsSuccessful();
        self::assertSame('try_again', $this->json('status'));
        self::assertSame('Slower, please.', $this->json('feedback.text'));
        self::assertFalse($this->json('feedback.forPreviousAttempt'));
        self::assertNull($this->json('completedAt'));
    }

    public function testCompleteMovesTheAssignmentToCompletedFor30Days(): void
    {
        [$teacher, $assignment] = $this->assignmentWithRecording();
        $this->client->loginUser($teacher);

        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'complete', 'feedback' => 'Well done!', 'version' => $assignment->getVersion()]);

        self::assertResponseIsSuccessful();
        self::assertSame('completed', $this->json('status'));
        self::assertSame('2026-11-22T10:00:00+00:00', $this->json('completedAt'));
        self::assertSame('2026-12-22T10:00:00+00:00', $this->json('deleteAt'));
        // The recordings stay until the deletion.
        self::assertCount(1, $this->jsonList('recordings'));
    }

    public function testTheTeacherCanCompleteWithoutARecording(): void
    {
        $teacher = $this->createTeacher();
        $assignment = $this->createAssignment($this->createStudent($teacher));
        $this->client->loginUser($teacher);

        // From the student screen.
        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'complete', 'feedback' => 'We did it in the lesson.', 'version' => $assignment->getVersion()]);

        self::assertResponseIsSuccessful();
        self::assertSame('completed', $this->json('status'));
    }

    public function testAReviewNeedsFeedback(): void
    {
        [$teacher, $assignment] = $this->assignmentWithRecording();
        $this->client->loginUser($teacher);

        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'complete', 'feedback' => '   ', 'version' => $assignment->getVersion()]);

        $this->assertError(422, 'validation_failed');
        self::assertSame('feedback', $this->json('violations.0.field'));
        self::assertFalse($this->reload($assignment)->isCompleted());
    }

    public function testTryAgainNeedsANewRecording(): void
    {
        $teacher = $this->createTeacher();
        $assignment = $this->createAssignment($this->createStudent($teacher));
        $this->client->loginUser($teacher);

        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'try_again', 'feedback' => 'Slower.', 'version' => $assignment->getVersion()]);

        $this->assertError(409, 'nothing_to_review');
    }

    public function testACompletedAssignmentCannotBeReviewedAgain(): void
    {
        [$teacher, $assignment] = $this->assignmentWithRecording();
        $this->client->loginUser($teacher);
        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'complete', 'feedback' => 'Well done!', 'version' => $assignment->getVersion()]);

        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'try_again', 'feedback' => 'One more time.', 'version' => $this->jsonInt('version')]);

        $this->assertError(409, 'assignment_completed');
    }

    public function testAReviewIsRefusedWhenTheParentSentANewRecordingInTheMeantime(): void
    {
        [$teacher, $assignment] = $this->assignmentWithRecording();
        $id = $assignment->getId();
        // The teacher opens the Assignment and watches the first video.
        $this->client->loginUser($teacher);
        $this->get("/api/assignments/$id");
        $seenVersion = $this->jsonInt('version');

        // The parent replaces the video.
        $this->client->loginUser($assignment->getStudent()->getParent());
        $uploadId = str_repeat('d', 32);
        $this->storage()->put("uploads/recordings/$id/video/$uploadId", 'second video', 'video/mp4');
        $this->post("/api/assignments/$id/recordings", ['kind' => 'video', 'uploadId' => $uploadId]);
        self::assertResponseIsSuccessful();

        // The feedback was written for the first video: it must not be saved for the second one.
        $this->client->loginUser($this->reloadUser($teacher));
        $this->post("/api/assignments/$id/review", ['action' => 'try_again', 'feedback' => 'About the first video.', 'version' => $seenVersion]);

        $this->assertError(409, 'changed_meanwhile');
        $this->get("/api/assignments/$id");
        self::assertSame('sent', $this->json('status'));
        self::assertNull($this->json('feedback'));
    }

    public function testAReviewNeedsTheVersion(): void
    {
        [$teacher, $assignment] = $this->assignmentWithRecording();
        $this->client->loginUser($teacher);

        $this->post("/api/assignments/{$assignment->getId()}/review", ['action' => 'complete', 'feedback' => 'Well done!']);

        $this->assertError(422, 'validation_failed');
        self::assertSame('version', $this->json('violations.0.field'));
    }

    public function testOnlyTheTeacherOfTheStudentReviews(): void
    {
        [, $assignment] = $this->assignmentWithRecording();
        $url = "/api/assignments/{$assignment->getId()}/review";
        $body = ['action' => 'complete', 'feedback' => 'Well done!', 'version' => $assignment->getVersion()];

        $this->client->loginUser($assignment->getStudent()->getParent());
        $this->post($url, $body);
        $this->assertError(403, 'forbidden');

        $this->client->loginUser($this->createTeacher('second@example.test'));
        $this->post($url, $body);
        $this->assertError(403, 'forbidden');

        self::assertFalse($this->reload($assignment)->isCompleted());
    }

    public function testTheParentSeesTheMaterialFilesThroughAShortLivedLink(): void
    {
        $teacher = $this->createTeacher('first@example.test');
        $student = $this->createStudent($teacher, 'p1@example.test');
        $this->client->loginUser($teacher);
        $pdf = $this->uploadMaterial($teacher, 'sheet_music', 'application/pdf');
        $this->post('/api/assignments', ['studentId' => $student->getId(), 'title' => 'Minuet', 'sheetMusicUploadIds' => [$pdf]]);
        $assignmentId = $this->jsonInt('id');
        $fileId = $this->jsonInt('materialFiles.0.id');
        $otherParent = $this->createStudent($teacher, 'p2@example.test')->getParent();

        $this->client->loginUser($this->reloadUser($student->getParent()));
        $this->get("/api/assignments/$assignmentId/material-files/$fileId/url");

        self::assertResponseIsSuccessful();
        self::assertMatchesRegularExpression('#^https://storage\.test/materials/[0-9a-f]{32}\?download$#', $this->jsonString('url'));
        self::assertSame(3600, $this->json('expiresIn'));

        $this->get("/api/assignments/$assignmentId/material-files/999999/url");
        $this->assertError(404, 'file_not_found');

        // A parent without an Assignment for this Material has no access.
        $this->client->loginUser($otherParent);
        $this->get("/api/assignments/$assignmentId/material-files/$fileId/url");
        $this->assertError(403, 'forbidden');
    }

    /** @return array{User, Assignment} */
    private function assignmentWithRecording(): array
    {
        $teacher = $this->createTeacher();
        $assignment = $this->createAssignment($this->createStudent($teacher));
        $this->addRecording($assignment);

        return [$teacher, $assignment];
    }

    /**
     * Plays the browser: asks for an upload URL and puts a file into the storage under the temporary key.
     *
     * @return string the upload id
     */
    private function uploadMaterial(User $teacher, string $purpose, string $mimeType): string
    {
        $prefix = 'sheet_music' === $purpose ? MaterialUploads::sheetMusicPrefix($teacher) : MaterialUploads::audioExamplePrefix($teacher);
        $uploadId = bin2hex(random_bytes(16));
        $this->storage()->put($prefix.$uploadId, 'file content', $mimeType);

        return $uploadId;
    }

    private function reloadUser(User $user): User
    {
        $fresh = $this->entityManager()->find(User::class, $user->getId());
        self::assertNotNull($fresh);

        return $fresh;
    }
}
