<?php

declare(strict_types=1);

namespace App\Entity;

/**
 * The status that the user sees on a piece card (docs/product/assignment-lifecycle.md).
 * It is not a column: Assignment::getPieceStatus() derives it from the two status fields.
 */
enum PieceStatus: string
{
    case InProgress = 'in_progress';
    case Sent = 'sent';
    case TryAgain = 'try_again';
    case Completed = 'completed';
}
