<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;

/**
 * The limits for endpoints that a script could call again and again (config/packages/rate_limiter.yaml).
 * A controller calls one method before it does the work; over the limit the answer is 429 with "Retry-After".
 *
 * The limit of failed sign-ins is not here: Symfony Security has its own (login_throttling in security.yaml).
 *
 * https://symfony.com/doc/current/rate_limiter.html
 */
final readonly class Limiter
{
    public function __construct(
        #[Target('sign_up.limiter')]
        private RateLimiterFactoryInterface $signUp,
        #[Target('invitation_email.limiter')]
        private RateLimiterFactoryInterface $invitationEmail,
        #[Target('invitation_email_total.limiter')]
        private RateLimiterFactoryInterface $invitationEmailTotal,
        #[Target('upload_url.limiter')]
        private RateLimiterFactoryInterface $uploadUrl,
    ) {
    }

    /** Teacher sign-up is open to guests, so it is counted per IP address. */
    public function signUp(?string $ipAddress): void
    {
        self::consume($this->signUp, 'ip-'.$ipAddress);
    }

    /**
     * An invitation email goes to an address that the teacher types: a teacher account must not be a tool
     * to send many emails. Counted per teacher, and once more for all teachers together.
     */
    public function invitationEmail(User $teacher): void
    {
        self::consume($this->invitationEmail, 'teacher-'.$teacher->getId());
        self::consume($this->invitationEmailTotal, 'all');
    }

    /**
     * A signed upload URL lets the browser put a file of any size into the bucket (docs/tech/backend.md,
     * "Signed URLs"), so the number of URLs per user is limited.
     */
    public function uploadUrl(User $user): void
    {
        self::consume($this->uploadUrl, 'user-'.$user->getId());
    }

    private static function consume(RateLimiterFactoryInterface $factory, string $key): void
    {
        $limit = $factory->create($key)->consume();
        if (!$limit->isAccepted()) {
            throw new TooManyRequestsHttpException(max(1, $limit->getRetryAfter()->getTimestamp() - time()));
        }
    }
}
