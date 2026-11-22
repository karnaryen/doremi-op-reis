<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** The JSON body of "POST /api/parents". The teacher is the signed-in user, never a field of the body. */
final readonly class AddParentRequest
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: PersonName::MAX_LENGTH)]
        #[Assert\Regex(PersonName::PATTERN, message: PersonName::MESSAGE, normalizer: 'trim')]
        public string $name = '',
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Email]
        #[Assert\Length(max: 180)]
        public string $email = '',
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: PersonName::MAX_LENGTH)]
        #[Assert\Regex(PersonName::PATTERN, message: PersonName::MESSAGE, normalizer: 'trim')]
        public string $childName = '',
    ) {
    }
}
