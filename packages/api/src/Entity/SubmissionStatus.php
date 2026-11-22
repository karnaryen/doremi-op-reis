<?php

declare(strict_types=1);

namespace App\Entity;

/** The second status field: does the latest recording wait for the teacher? */
enum SubmissionStatus: string
{
    case PendingReview = 'pending_review';
    case Reviewed = 'reviewed';
}
