<?php

declare(strict_types=1);

namespace App\Entity;

/** The first of the two status fields (docs/tech/data-model.md, "Status fields"). */
enum AssignmentStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
}
