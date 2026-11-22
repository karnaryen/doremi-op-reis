<?php

declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\Assignment;
use App\Entity\AssignmentStatus;
use App\Entity\Material;
use App\Entity\PieceStatus;
use App\Entity\RecordingKind;
use App\Entity\StoredObject;
use App\Entity\Student;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests of the lifecycle rules (docs/product/assignment-lifecycle.md). No database, no container:
 * the rules are methods of the entity, so they can be tested with plain objects.
 */
final class AssignmentTest extends TestCase
{
    private \DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->now = new \DateTimeImmutable('2026-11-22 10:00:00');
    }

    public function testANewAssignmentIsInProgress(): void
    {
        $assignment = $this->assignment();

        self::assertSame(PieceStatus::InProgress, $assignment->getPieceStatus());
        self::assertNull($assignment->getSubmission());
        self::assertFalse($assignment->isWaitingForReview());
    }

    public function testARecordingSetsTheStatusSent(): void
    {
        $assignment = $this->assignment();

        $replaced = $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/1'), $this->now);

        self::assertNull($replaced);
        self::assertSame(PieceStatus::Sent, $assignment->getPieceStatus());
        self::assertTrue($assignment->isWaitingForReview());
    }

    public function testANewVideoReplacesTheOldVideoAndKeepsTheAudio(): void
    {
        $assignment = $this->assignment();
        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/video-1'), $this->now);
        $assignment->submitRecording(RecordingKind::Audio, $this->file('recordings/audio-1'), $this->now);

        $replaced = $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/video-2'), $this->now);

        self::assertSame('recordings/video-1', $replaced, 'The caller deletes the old file from the storage.');
        $submission = $assignment->getSubmission();
        self::assertNotNull($submission);
        self::assertCount(2, $submission->getRecordings());
        self::assertSame('recordings/video-2', $submission->getRecording(RecordingKind::Video)?->getFile()->objectKey);
        self::assertSame('recordings/audio-1', $submission->getRecording(RecordingKind::Audio)?->getFile()->objectKey);
    }

    public function testAskToTryAgainSavesTheFeedbackAndSetsTheStatusTryAgain(): void
    {
        $assignment = $this->assignment();
        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/1'), $this->now);

        $assignment->askToTryAgain('Slower, please.', $this->now);

        self::assertSame(PieceStatus::TryAgain, $assignment->getPieceStatus());
        self::assertSame('Slower, please.', $assignment->getFeedback()?->getText());
        self::assertFalse($assignment->hasFeedbackForPreviousAttempt());
    }

    public function testAskToTryAgainNeedsANewRecording(): void
    {
        $assignment = $this->assignment();

        $this->expectException(\LogicException::class);

        $assignment->askToTryAgain('Slower, please.', $this->now);
    }

    public function testFeedbackIsForThePreviousAttemptAfterANewRecording(): void
    {
        $assignment = $this->assignment();
        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/1'), $this->now);
        $assignment->askToTryAgain('Slower, please.', $this->now);

        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/2'), $this->now);

        self::assertSame(PieceStatus::Sent, $assignment->getPieceStatus());
        self::assertTrue($assignment->hasFeedbackForPreviousAttempt());
    }

    public function testANewReviewReplacesTheFeedback(): void
    {
        $assignment = $this->assignment();
        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/1'), $this->now);
        $assignment->askToTryAgain('First advice.', $this->now);
        $first = $assignment->getFeedback();
        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/2'), $this->now);

        $assignment->askToTryAgain('Second advice.', $this->now->modify('+1 day'));

        self::assertSame($first, $assignment->getFeedback(), 'One Feedback row per Assignment: the text is replaced.');
        self::assertSame('Second advice.', $assignment->getFeedback()?->getText());
    }

    public function testCompleteStartsThe30DaysUntilDeletion(): void
    {
        $assignment = $this->assignment();
        $completedAt = $this->now->modify('+3 days');

        $assignment->complete('Well done!', $completedAt);

        self::assertSame(AssignmentStatus::Completed, $assignment->getStatus());
        self::assertSame(PieceStatus::Completed, $assignment->getPieceStatus());
        self::assertEquals($completedAt, $assignment->getCompletedAt());
        // From the day of completion, not from the day of the assignment or of the upload.
        self::assertEquals(new \DateTimeImmutable('2026-12-25 10:00:00'), $assignment->getDeleteAt());
        self::assertSame('Well done!', $assignment->getFeedback()?->getText());
    }

    public function testACompletedAssignmentCannotBeCompletedAgain(): void
    {
        $assignment = $this->assignment();
        $assignment->complete('Well done!', $this->now);

        $this->expectException(\LogicException::class);

        $assignment->complete('Again', $this->now);
    }

    public function testACompletedAssignmentTakesNoRecording(): void
    {
        $assignment = $this->assignment();
        $assignment->complete('Well done!', $this->now);

        self::assertFalse($assignment->canReceiveRecording());
        $this->expectException(\LogicException::class);

        $assignment->submitRecording(RecordingKind::Video, $this->file('recordings/1'), $this->now);
    }

    public function testAStudentCannotGetTheMaterialOfAnotherTeacher(): void
    {
        $other = User::teacher('Other', 'other@example.test', $this->now);
        self::setId($other, 2);
        $student = $this->student();

        $this->expectException(\LogicException::class);

        new Assignment($student, new Material($other, 'Minuet', null, $this->now), null, null, $this->now);
    }

    private function assignment(): Assignment
    {
        $student = $this->student();
        $teacher = $student->getParent()->getTeacher();
        self::assertNotNull($teacher);

        return new Assignment($student, new Material($teacher, 'Minuet', null, $this->now), null, null, $this->now);
    }

    private function student(): Student
    {
        $teacher = User::teacher('Tessa', 'teacher@example.test', $this->now);
        self::setId($teacher, 1);

        return new Student(User::parentOf($teacher, 'Paula', 'parent@example.test', $this->now), 'Charlie', $this->now);
    }

    private function file(string $key): StoredObject
    {
        return new StoredObject($key, 'video/mp4', 1000, $this->now);
    }

    /** The database gives the id. A unit test has no database, so the test sets the private field. */
    private static function setId(User $user, int $id): void
    {
        new \ReflectionProperty(User::class, 'id')->setValue($user, $id);
    }
}
