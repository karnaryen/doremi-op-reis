<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Assignment;
use App\Entity\RecordingKind;
use App\Storage\StorageException;
use App\Tests\Storage\InMemoryObjectStorage;

/** The parent uploads a recording; the teacher and the parent play it. */
final class RecordingTest extends ApiTestCase
{
    public function testTheWholeUploadFlow(): void
    {
        $assignment = $this->assignment();
        $id = $assignment->getId();
        $this->client->loginUser($assignment->getStudent()->getParent());

        // 1. The parent asks where to send the file.
        $this->post("/api/assignments/$id/recordings/upload-url", ['kind' => 'video', 'mimeType' => 'video/quicktime', 'size' => 5_000_000]);
        self::assertResponseIsSuccessful();
        $uploadId = $this->jsonString('uploadId');
        self::assertSame(InMemoryObjectStorage::BASE_URL."uploads/recordings/$id/video/$uploadId?upload", $this->json('uploadUrl'));
        self::assertSame(900, $this->json('expiresIn'));

        // 2. The browser sends the file to the storage. The API is not a part of this step.
        $this->storage()->put("uploads/recordings/$id/video/$uploadId", 'the video', 'video/quicktime');

        // 3. The parent confirms the upload.
        $this->post("/api/assignments/$id/recordings", ['kind' => 'video', 'uploadId' => $uploadId]);
        self::assertResponseIsSuccessful();
        self::assertSame('sent', $this->json('status'));
        self::assertSame('video', $this->json('recordings.0.kind'));
        self::assertSame('video/quicktime', $this->json('recordings.0.mimeType'));
        self::assertSame(9, $this->json('recordings.0.size'));
        self::assertSame('2026-11-22T10:00:00+00:00', $this->json('submittedAt'));

        // One object under a final key; the temporary upload is deleted.
        $keys = $this->storage()->keys();
        self::assertCount(1, $keys);
        self::assertMatchesRegularExpression('#^recordings/[0-9a-f]{32}$#', $keys[0]);
        self::assertSame($keys[0], $this->reload($assignment)->getSubmission()?->getRecording(RecordingKind::Video)?->getFile()->objectKey);
    }

    public function testANewVideoReplacesTheOldOneAndKeepsTheAudio(): void
    {
        $assignment = $this->assignment();
        $this->addRecording($assignment, RecordingKind::Video, 'recordings/old-video');
        $this->addRecording($assignment, RecordingKind::Audio, 'recordings/audio');
        $this->client->loginUser($assignment->getStudent()->getParent());

        $this->confirmUpload($assignment, 'video', 'video/mp4');

        self::assertResponseIsSuccessful();
        self::assertCount(2, $this->jsonList('recordings'));
        self::assertFalse($this->storage()->has('recordings/old-video'), 'The old video is deleted after the new one is saved.');
        self::assertTrue($this->storage()->has('recordings/audio'));
        self::assertSame(2, $this->storage()->count());
        // The row of the video was reused: still two rows, and the video row has the key of the new object.
        $keys = $this->entityManager()->getConnection()->fetchFirstColumn('SELECT object_key FROM recording ORDER BY kind');
        self::assertCount(2, $keys);
        self::assertSame('recordings/audio', $keys[0]);
        self::assertIsString($keys[1]);
        self::assertTrue($this->storage()->has($keys[1]));
    }

    public function testANewRecordingAfterAReviewMarksTheFeedbackAsAdviceForThePreviousAttempt(): void
    {
        $assignment = $this->assignment();
        $this->addRecording($assignment);
        $assignment->askToTryAgain('Slower, please.', new \DateTimeImmutable(self::NOW));
        $this->entityManager()->flush();
        $this->client->loginUser($assignment->getStudent()->getParent());

        $this->confirmUpload($assignment, 'video', 'video/mp4');

        self::assertSame('sent', $this->json('status'));
        self::assertSame('Slower, please.', $this->json('feedback.text'));
        self::assertTrue($this->json('feedback.forPreviousAttempt'));
    }

    public function testAFileOfAnotherTypeIsRefusedAndTheOldRecordingStays(): void
    {
        $assignment = $this->assignment();
        $this->addRecording($assignment, RecordingKind::Video, 'recordings/old-video');
        $this->client->loginUser($assignment->getStudent()->getParent());

        // The upload URL does not fix the type: a script can send anything to it.
        $this->confirmUpload($assignment, 'video', 'text/html');

        $this->assertError(422, 'file_not_accepted');
        self::assertSame(['recordings/old-video'], $this->storage()->keys());
        self::assertSame('recordings/old-video', $this->reload($assignment)->getSubmission()?->getRecording(RecordingKind::Video)?->getFile()->objectKey);
    }

    public function testConfirmWithoutAnUploadFails(): void
    {
        $assignment = $this->assignment();
        $this->client->loginUser($assignment->getStudent()->getParent());

        $this->post("/api/assignments/{$assignment->getId()}/recordings", ['kind' => 'video', 'uploadId' => str_repeat('a', 32)]);
        $this->assertError(422, 'upload_not_found');

        // The id is a part of a storage key: only 32 hex characters are allowed.
        $this->post("/api/assignments/{$assignment->getId()}/recordings", ['kind' => 'video', 'uploadId' => '../../materials/x']);
        $this->assertError(422, 'validation_failed');

        self::assertNull($this->reload($assignment)->getSubmission());
    }

    public function testAnUploadForAnotherAssignmentCannotBeConfirmed(): void
    {
        $teacher = $this->createTeacher();
        $mine = $this->createAssignment($this->createStudent($teacher, 'p1@example.test'));
        $other = $this->createAssignment($this->createStudent($teacher, 'p2@example.test'));
        $uploadId = str_repeat('b', 32);
        $this->storage()->put("uploads/recordings/{$other->getId()}/video/$uploadId", 'the video of another family', 'video/mp4');
        $this->client->loginUser($mine->getStudent()->getParent());

        $this->post("/api/assignments/{$mine->getId()}/recordings", ['kind' => 'video', 'uploadId' => $uploadId]);

        $this->assertError(422, 'upload_not_found');
    }

    public function testTheUploadUrlRefusesWrongTypesAndLargeFiles(): void
    {
        $assignment = $this->assignment();
        $url = "/api/assignments/{$assignment->getId()}/recordings/upload-url";
        $this->client->loginUser($assignment->getStudent()->getParent());

        $this->post($url, ['kind' => 'video', 'mimeType' => 'audio/mpeg', 'size' => 1000]);
        $this->assertError(422, 'file_not_accepted');

        $this->post($url, ['kind' => 'audio', 'mimeType' => 'audio/mpeg', 'size' => 31 * 1024 * 1024]);
        $this->assertError(422, 'file_not_accepted');

        $this->post($url, ['kind' => 'photo', 'mimeType' => 'image/png', 'size' => 1000]);
        $this->assertError(422, 'validation_failed');
    }

    public function testOnlyTheParentOfTheStudentUploads(): void
    {
        $teacher = $this->createTeacher();
        $assignment = $this->createAssignment($this->createStudent($teacher, 'p1@example.test'));
        $otherParent = $this->createStudent($teacher, 'p2@example.test')->getParent();
        $url = "/api/assignments/{$assignment->getId()}/recordings/upload-url";
        $body = ['kind' => 'video', 'mimeType' => 'video/mp4', 'size' => 1000];

        $this->post($url, $body);
        $this->assertError(401, 'unauthorized');

        foreach ([$teacher, $otherParent] as $user) {
            $this->client->loginUser($user);
            $this->post($url, $body);
            $this->assertError(403, 'forbidden');
            $this->post("/api/assignments/{$assignment->getId()}/recordings", ['kind' => 'video', 'uploadId' => str_repeat('a', 32)]);
            $this->assertError(403, 'forbidden');
        }
    }

    public function testACompletedAssignmentTakesNoRecording(): void
    {
        $assignment = $this->assignment();
        $assignment->complete('Well done!', new \DateTimeImmutable(self::NOW));
        $this->entityManager()->flush();
        $this->client->loginUser($assignment->getStudent()->getParent());

        $this->post("/api/assignments/{$assignment->getId()}/recordings/upload-url", ['kind' => 'video', 'mimeType' => 'video/mp4', 'size' => 1000]);
        $this->assertError(409, 'assignment_completed');

        $this->confirmUpload($assignment, 'video', 'video/mp4');
        $this->assertError(409, 'assignment_completed');
    }

    public function testTheRecordingIsSavedEvenIfTheOldFileCannotBeDeleted(): void
    {
        $assignment = $this->assignment();
        $this->addRecording($assignment, RecordingKind::Video, 'recordings/old-video');
        $this->client->loginUser($assignment->getStudent()->getParent());
        $uploadId = str_repeat('c', 32);
        $this->storage()->put("uploads/recordings/{$assignment->getId()}/video/$uploadId", 'new video', 'video/mp4');
        // R2 answers to the copy and the check, and then stops answering.
        $this->storage()->failOn('delete', new StorageException('R2 is down.'));

        $this->post("/api/assignments/{$assignment->getId()}/recordings", ['kind' => 'video', 'uploadId' => $uploadId]);

        // The request has done its work. The old object has no row any more; the daily job removes it.
        self::assertResponseIsSuccessful();
        self::assertNotSame('recordings/old-video', $this->reload($assignment)->getSubmission()?->getRecording(RecordingKind::Video)?->getFile()->objectKey);
    }

    public function testAStorageFailureIsA503AndSavesNothing(): void
    {
        $assignment = $this->assignment();
        $this->client->loginUser($assignment->getStudent()->getParent());
        $this->storage()->failOn('copy', new StorageException('R2 is down.'));

        $this->post("/api/assignments/{$assignment->getId()}/recordings", ['kind' => 'video', 'uploadId' => str_repeat('a', 32)]);

        $this->assertError(503, 'storage_unavailable');
        self::assertNull($this->reload($assignment)->getSubmission());
    }

    public function testTheTeacherAndTheParentGetALinkToTheRecording(): void
    {
        $teacher = $this->createTeacher('first@example.test');
        $assignment = $this->createAssignment($this->createStudent($teacher, 'p1@example.test'));
        $this->addRecording($assignment, RecordingKind::Video, 'recordings/the-video');
        $otherParent = $this->createStudent($teacher, 'p2@example.test')->getParent();
        $otherTeacher = $this->createTeacher('second@example.test');
        $url = "/api/assignments/{$assignment->getId()}/recordings/video/url";

        $this->get($url);
        $this->assertError(401, 'unauthorized');

        foreach ([$teacher, $assignment->getStudent()->getParent()] as $user) {
            $this->client->loginUser($user);
            $this->get($url);
            self::assertResponseIsSuccessful();
            self::assertSame('https://storage.test/recordings/the-video?download', $this->json('url'));
            self::assertSame(3600, $this->json('expiresIn'));
        }

        foreach ([$otherParent, $otherTeacher] as $user) {
            $this->client->loginUser($user);
            $this->get($url);
            $this->assertError(403, 'forbidden');
        }
    }

    public function testNoLinkForARecordingThatDoesNotExist(): void
    {
        $assignment = $this->assignment();
        $this->addRecording($assignment, RecordingKind::Video);
        $this->client->loginUser($assignment->getStudent()->getParent());

        $this->get("/api/assignments/{$assignment->getId()}/recordings/audio/url");
        $this->assertError(404, 'file_not_found');

        $this->get("/api/assignments/{$assignment->getId()}/recordings/photo/url");
        $this->assertError(404, 'not_found');
    }

    private function assignment(): Assignment
    {
        return $this->createAssignment($this->createStudent($this->createTeacher()));
    }

    /** Puts a file into the storage as the browser would, then confirms it. */
    private function confirmUpload(Assignment $assignment, string $kind, string $mimeType): void
    {
        $uploadId = bin2hex(random_bytes(16));
        $this->storage()->put("uploads/recordings/{$assignment->getId()}/$kind/$uploadId", 'new recording', $mimeType);

        $this->post("/api/assignments/{$assignment->getId()}/recordings", ['kind' => $kind, 'uploadId' => $uploadId]);
    }
}
