<?php

declare(strict_types=1);

namespace App\Entity;

enum RecordingKind: string
{
    case Video = 'video';
    case Audio = 'audio';
}
