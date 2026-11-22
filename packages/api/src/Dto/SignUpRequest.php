<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * The JSON body of "POST /api/teachers".
 *
 * A DTO (data transfer object) has no behaviour: it is the typed shape of a request body.
 * #[MapRequestPayload] in the controller fills it from the JSON and checks the #[Assert\...] rules;
 * an invalid body never reaches the controller method (the answer is 422).
 * The default values make a missing field an empty value, so NotBlank reports it by name.
 * normalizer: 'trim' makes a text of spaces only blank too.
 *
 * https://symfony.com/doc/current/controller.html#mapping-request-payload
 */
final readonly class SignUpRequest
{
    public const int PASSWORD_MIN_LENGTH = 10;
    /** Symfony refuses longer passwords: hashing a very long text costs too much server time. */
    public const int PASSWORD_MAX_LENGTH = 4096;

    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: PersonName::MAX_LENGTH)]
        #[Assert\Regex(PersonName::PATTERN, message: PersonName::MESSAGE, normalizer: 'trim')]
        public string $name = '',
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Email]
        #[Assert\Length(max: 180)]
        public string $email = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: self::PASSWORD_MIN_LENGTH, max: self::PASSWORD_MAX_LENGTH)]
        #[\SensitiveParameter]
        public string $password = '',
    ) {
    }
}
