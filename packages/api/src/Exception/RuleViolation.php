<?php

declare(strict_types=1);

namespace App\Exception;

use Psr\Log\LogLevel;
use Symfony\Component\HttpKernel\Attribute\WithLogLevel;

/**
 * A request is valid JSON with valid fields, but a rule of the product says no:
 * the email is taken, the invitation has expired, the assignment is already completed.
 *
 * A service throws it; ApiExceptionSubscriber turns it into a JSON answer:
 * {"error": "<errorCode>", "message": "..."} with the HTTP status of the rule.
 * The frontend reads errorCode and shows its own translated text.
 *
 * Trade-off: the class knows HTTP status codes, which is not pure domain code.
 * The alternative is one exception class per rule plus a mapping table: more files for the same result.
 */
// An expected answer to a request, not a failure of the server: without this Symfony logs it as "critical".
#[WithLogLevel(LogLevel::NOTICE)]
final class RuleViolation extends \RuntimeException
{
    private function __construct(
        public readonly string $errorCode,
        public readonly int $statusCode,
        string $message,
    ) {
        parent::__construct($message);
    }

    public static function emailAlreadyUsed(): self
    {
        return new self('email_already_used', 409, 'An account with this email already exists.');
    }

    public static function invitationInvalid(): self
    {
        return new self('invitation_invalid', 422, 'This invitation link does not work or has expired.');
    }

    public static function passwordAlreadySet(): self
    {
        return new self('password_already_set', 409, 'This parent has already set a password.');
    }

    public static function studentNotFound(): self
    {
        return new self('student_not_found', 422, 'This student does not exist.');
    }

    public static function assignmentCompleted(): self
    {
        return new self('assignment_completed', 409, 'This assignment is already completed.');
    }

    public static function nothingToReview(): self
    {
        return new self('nothing_to_review', 409, 'There is no new recording to review.');
    }

    /** The Assignment was changed after the user opened it, or by another request at the same moment. */
    public static function changedMeanwhile(): self
    {
        return new self('changed_meanwhile', 409, 'This assignment was changed in the meantime. Look at it again and try once more.');
    }

    public static function uploadNotFound(): self
    {
        return new self('upload_not_found', 422, 'The uploaded file was not found. Upload it again.');
    }

    public static function fileNotAccepted(string $reason): self
    {
        return new self('file_not_accepted', 422, $reason);
    }

    public static function sheetMusicMixed(): self
    {
        return new self('file_not_accepted', 422, 'Sheet music is one PDF or one or more images, not both.');
    }

    public static function fileNotFound(): self
    {
        return new self('file_not_found', 404, 'This file does not exist.');
    }
}
