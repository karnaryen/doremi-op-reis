<?php

declare(strict_types=1);

namespace App\Dto;

/** The two buttons of the review screen. Both are equal, and both need feedback. */
enum ReviewAction: string
{
    case Complete = 'complete';
    case TryAgain = 'try_again';
}
