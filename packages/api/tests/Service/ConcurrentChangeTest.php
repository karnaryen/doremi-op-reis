<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Dto\ReviewAction;
use App\Entity\Assignment;
use App\Entity\RecordingKind;
use App\Exception\RuleViolation;
use App\Service\Assignments;
use App\Service\RecordingUploads;
use App\Tests\Api\ApiTestCase;

/**
 * Two requests change one Assignment at the same moment. A test cannot run two requests at once,
 * so it plays the other request with a plain SQL UPDATE between "read" and "save".
 * The version column of the Assignment makes the second save fail (optimistic locking).
 */
final class ConcurrentChangeTest extends ApiTestCase
{
    public function testAReviewFailsWhenTheAssignmentChangedInTheMeantime(): void
    {
        $assignment = $this->assignmentWithRecording();
        $this->changeInAnotherRequest($assignment);

        try {
            // The version that the teacher has seen is the one that this request has read: the change came after it.
            static::getContainer()->get(Assignments::class)->review($assignment, ReviewAction::Complete, 'Well done!', $assignment->getVersion());
            self::fail('The review must be refused.');
        } catch (RuleViolation $e) {
            self::assertSame('changed_meanwhile', $e->errorCode);
            self::assertSame(409, $e->statusCode);
        }

        self::assertSame('active', $this->entityManager()->getConnection()->fetchOne('SELECT status FROM assignment WHERE id = ?', [$assignment->getId()]));
    }

    public function testAReviewFailsWhenTheTeacherHasSeenAnOlderVersion(): void
    {
        $assignment = $this->assignmentWithRecording();
        $seenVersion = $assignment->getVersion();
        // The parent sends a new recording after the teacher opened the screen: the Assignment has a new version.
        $this->changeInAnotherRequest($assignment);
        $assignment = $this->reload($assignment);

        try {
            static::getContainer()->get(Assignments::class)->review($assignment, ReviewAction::TryAgain, 'For the old recording.', $seenVersion);
            self::fail('The review must be refused.');
        } catch (RuleViolation $e) {
            self::assertSame('changed_meanwhile', $e->errorCode);
        }

        self::assertSame(0, $this->entityManager()->getConnection()->fetchOne('SELECT COUNT(*) FROM feedback'));
    }

    public function testARecordingIsNotSavedWhenTheAssignmentChangedInTheMeantime(): void
    {
        $assignment = $this->assignmentWithRecording();
        $uploadId = str_repeat('a', 32);
        $this->storage()->put("uploads/recordings/{$assignment->getId()}/video/$uploadId", 'new video', 'video/mp4');
        // For example: the teacher completed the Assignment after the parent opened the upload screen.
        $this->changeInAnotherRequest($assignment);

        try {
            static::getContainer()->get(RecordingUploads::class)->confirm($assignment, RecordingKind::Video, $uploadId);
            self::fail('The recording must be refused.');
        } catch (RuleViolation $e) {
            self::assertSame('changed_meanwhile', $e->errorCode);
        }

        // The copy of the new file is deleted; the old recording and its file stay.
        $keys = $this->storage()->keys();
        sort($keys);
        self::assertSame(['recordings/first', "uploads/recordings/{$assignment->getId()}/video/$uploadId"], $keys);
        self::assertSame('recordings/first', $this->entityManager()->getConnection()->fetchOne('SELECT object_key FROM recording'));
    }

    private function assignmentWithRecording(): Assignment
    {
        $assignment = $this->createAssignment($this->createStudent($this->createTeacher()));
        $this->addRecording($assignment);

        return $assignment;
    }

    private function changeInAnotherRequest(Assignment $assignment): void
    {
        $this->entityManager()->getConnection()->executeStatement('UPDATE assignment SET version = version + 1 WHERE id = ?', [$assignment->getId()]);
    }
}
