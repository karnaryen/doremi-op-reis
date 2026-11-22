<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Student;

/** What "add parent" and "invite again" return: the student, and if the invitation email was sent. */
final readonly class InvitedParent
{
    public function __construct(
        public Student $student,
        /** False if the email provider refused the email. The account exists; the teacher sends it again. */
        public bool $invitationSent,
    ) {
    }
}
