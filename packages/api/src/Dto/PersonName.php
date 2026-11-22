<?php

declare(strict_types=1);

namespace App\Dto;

/**
 * The rule for the name of a person, used by the DTOs with a name field.
 *
 * Names are printed in the invitation email, which the app sends to an address that a teacher types.
 * Without a rule a "name" could be an advertisement or a link ("Your bank: go to evil.example"),
 * sent from our address. So a name is words of letters; a word may end with a dot ("J. de Vries"),
 * and words are joined by one space, apostrophe or hyphen ("Anne-Marie", "O'Brien").
 * No digits, no "/", ":" or "@", and no dot inside a word: a web address does not fit.
 */
final class PersonName
{
    public const int MAX_LENGTH = 80;
    public const string PATTERN = '/^[\p{L}\p{M}]+\.?(?:[ \'’-][\p{L}\p{M}]+\.?)*$/u';
    public const string MESSAGE = 'A name has only letters, spaces, hyphens, apostrophes and dots after a word.';

    private function __construct()
    {
    }
}
