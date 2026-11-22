<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** The JSON body of "POST /api/assignments/{id}/review". */
final readonly class ReviewRequest
{
    public function __construct(
        public ReviewAction $action,
        /**
         * The "version" of the Assignment that the teacher has on the screen (AssignmentDetailView).
         * If the Assignment has another version now, the teacher has not seen its latest state:
         * for example the parent sent a new recording in the meantime. The review is refused then.
         */
        #[Assert\Positive]
        public int $version = 0,
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: CreateAssignmentRequest::TEXT_MAX_LENGTH)]
        public string $feedback = '',
    ) {
    }
}
