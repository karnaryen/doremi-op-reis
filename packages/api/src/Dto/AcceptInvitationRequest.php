<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** The JSON body of "POST /api/invitations/accept". */
final readonly class AcceptInvitationRequest
{
    public function __construct(
        /** The token from the invitation link: 64 hex characters. */
        #[Assert\Regex('/^[0-9a-f]{64}$/', message: 'This invitation link is not complete.')]
        #[\SensitiveParameter]
        public string $token = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: SignUpRequest::PASSWORD_MIN_LENGTH, max: SignUpRequest::PASSWORD_MAX_LENGTH)]
        #[\SensitiveParameter]
        public string $password = '',
    ) {
    }
}
