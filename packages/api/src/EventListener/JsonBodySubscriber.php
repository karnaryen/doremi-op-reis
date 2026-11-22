<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Every request that changes data must say "Content-Type: application/json", also a request without a body.
 *
 * This protects against CSRF: another website makes the browser of a signed-in user send a request to our API,
 * and the browser adds the session cookie. A page of another website can send only "simple" requests without asking
 * first: a form or a text. For "application/json" the browser asks the API first (the CORS preflight request),
 * and config/packages/nelmio_cors.yaml answers "no" to every origin except our SPA.
 * The session cookie has SameSite=Lax as a second protection (config/packages/framework.yaml).
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#simple_requests
 */
final readonly class JsonBodySubscriber implements EventSubscriberInterface
{
    private const array READ_ONLY_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public static function getSubscribedEvents(): array
    {
        // Priority 16: after the router (32), so an unknown URL is still 404, and before the firewall (8),
        // so the rule also covers sign-in and sign-out.
        return [KernelEvents::REQUEST => ['onRequest', 16]];
    }

    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if (!$event->isMainRequest()
            || !str_starts_with($request->getPathInfo(), '/api/')
            || \in_array($request->getMethod(), self::READ_ONLY_METHODS, true)
        ) {
            return;
        }

        if ('json' !== $request->getContentTypeFormat()) {
            throw new UnsupportedMediaTypeHttpException('Send the request with the header "Content-Type: application/json".');
        }
    }
}
