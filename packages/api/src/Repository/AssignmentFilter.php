<?php

declare(strict_types=1);

namespace App\Repository;

/** The tabs of the section "Main" (docs/product/users.md, "Tabs in Main"). */
enum AssignmentFilter: string
{
    /** Active Assignments with a recording that waits for the teacher. For the teacher only. */
    case ToReview = 'to_review';
    case Active = 'active';
    case Completed = 'completed';
}
