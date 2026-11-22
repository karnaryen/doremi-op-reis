<?php

declare(strict_types=1);

namespace App\Entity;

/** What a file is in a Material. */
enum MaterialFilePurpose: string
{
    case SheetMusic = 'sheet_music';
    case AudioExample = 'audio_example';
}
