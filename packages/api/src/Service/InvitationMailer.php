<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Sends the invitation email. The app has two languages and does not know the language of a new parent,
 * so the email has both texts.
 */
final readonly class InvitationMailer
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        /** The origin of the SPA, for example https://doremi.example.com. The link in the email starts with it. */
        #[Autowire(env: 'APP_FRONTEND_URL')]
        private string $frontendUrl,
        #[Autowire(env: 'MAILER_FROM')]
        private string $from,
    ) {
    }

    /**
     * @return bool false if the email could not be sent. The parent account exists then,
     *              and the teacher can send the invitation again.
     */
    public function send(User $parent, User $teacher, #[\SensitiveParameter] string $token): bool
    {
        // The token is in the fragment (after "#"). A browser does not send the fragment to a server,
        // so the token is not in the access log of the web host and not in a "Referer" header.
        $link = \sprintf('%s/set-password#token=%s', rtrim($this->frontendUrl, '/'), $token);

        $email = (new Email())
            ->from(Address::create($this->from))
            ->to(new Address($parent->getEmail(), $parent->getName()))
            ->subject('Doremi op reis: uitnodiging / invitation')
            ->text(<<<TEXT
                Hallo {$parent->getName()},

                {$teacher->getName()} nodigt je uit voor Doremi op reis. Daar vind je de stukken van je kind en stuur je opnames naar de docent.
                Kies een wachtwoord via deze link (7 dagen geldig):

                {$link}

                ---

                Hello {$parent->getName()},

                {$teacher->getName()} invites you to Doremi op reis. There you find the pieces of your child and send recordings to the teacher.
                Choose a password with this link (valid for 7 days):

                {$link}
                TEXT);

        try {
            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            // No link and no token in the log.
            $this->logger->error('Could not send the invitation email to the parent {id}.', ['id' => $parent->getId(), 'exception' => $e]);

            return false;
        }

        return true;
    }
}
