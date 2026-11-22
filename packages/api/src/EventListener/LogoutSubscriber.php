<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Event\LogoutEvent;

/**
 * Symfony ends the session at "POST /api/logout" (config/packages/security.yaml) and then redirects to "/".
 * An API has no page to redirect to, so this class sets an empty answer: 204 No Content.
 *
 * https://symfony.com/doc/current/security.html#customizing-logout
 */
final readonly class LogoutSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [LogoutEvent::class => 'onLogout'];
    }

    public function onLogout(LogoutEvent $event): void
    {
        $event->setResponse(new Response(null, Response::HTTP_NO_CONTENT));
    }
}
