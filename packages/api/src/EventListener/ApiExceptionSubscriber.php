<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Exception\RuleViolation;
use App\Storage\StorageException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\Exception\ValidationFailedException;

/**
 * Turns every exception under /api into one JSON shape:
 *
 *     {"error": "validation_failed", "message": "...", "violations": [{"field": "email", "message": "..."}]}
 *
 * "error" is a stable code for the frontend, "message" is English text for a developer,
 * "violations" exists only for invalid fields. Without this class Symfony answers with an HTML error page.
 *
 * An unexpected exception becomes 500 without details: an error text can contain SQL or a file path.
 * Symfony has already written the exception to the log when this class runs.
 */
final readonly class ApiExceptionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire(param: 'kernel.debug')]
        private bool $debug,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        // Priority -10: after the security listener (1), which turns "access denied" into 401 or 403,
        // and after the logger of Symfony (0); before the HTML error page of Symfony (-128).
        return [KernelEvents::EXCEPTION => ['onException', -10]];
    }

    public function onException(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $exception = $event->getThrowable();
        $headers = [];

        if ($exception instanceof RuleViolation) {
            $status = $exception->statusCode;
            $body = ['error' => $exception->errorCode, 'message' => $exception->getMessage()];
        } elseif ($exception instanceof HttpExceptionInterface) {
            $status = $exception->getStatusCode();
            $headers = $exception->getHeaders();
            $validation = $exception->getPrevious();
            $body = $validation instanceof ValidationFailedException
                ? ['error' => 'validation_failed', 'message' => 'Some fields are not valid.', 'violations' => self::violations($validation)]
                // The status text ("Not Found"), not the message of the exception: that can name a class or a route.
                : ['error' => self::code($status), 'message' => Response::$statusTexts[$status] ?? 'Error'];
        } elseif ($exception instanceof StorageException) {
            $status = Response::HTTP_SERVICE_UNAVAILABLE;
            $body = ['error' => 'storage_unavailable', 'message' => 'The file storage does not answer. Try again later.'];
        } else {
            $status = Response::HTTP_INTERNAL_SERVER_ERROR;
            $body = ['error' => 'server_error', 'message' => 'Something went wrong on the server.'];
        }

        if ($this->debug && !$exception instanceof RuleViolation) {
            // Development only: the real error, so it is visible in the browser tools.
            $body['debug'] = \sprintf('%s: %s', $exception::class, $exception->getMessage());
        }

        $event->setResponse(new JsonResponse($body, $status, $headers));
    }

    /** @return list<array{field: string, message: string}> */
    private static function violations(ValidationFailedException $exception): array
    {
        $violations = [];
        foreach ($exception->getViolations() as $violation) {
            $violations[] = ['field' => $violation->getPropertyPath(), 'message' => (string) $violation->getMessage()];
        }

        return $violations;
    }

    private static function code(int $status): string
    {
        return match ($status) {
            Response::HTTP_BAD_REQUEST => 'bad_request',
            Response::HTTP_UNAUTHORIZED => 'unauthorized',
            Response::HTTP_FORBIDDEN => 'forbidden',
            Response::HTTP_NOT_FOUND => 'not_found',
            Response::HTTP_METHOD_NOT_ALLOWED => 'method_not_allowed',
            Response::HTTP_UNSUPPORTED_MEDIA_TYPE => 'unsupported_media_type',
            Response::HTTP_UNPROCESSABLE_ENTITY => 'validation_failed',
            Response::HTTP_TOO_MANY_REQUESTS => 'too_many_requests',
            default => $status >= 500 ? 'server_error' : 'request_failed',
        };
    }
}
