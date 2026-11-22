<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\StudentRepository;
use App\View\ProfileView;

/** Builds the JSON of the signed-in user. A parent also gets the name of the child. */
final readonly class Profiles
{
    public function __construct(private StudentRepository $students)
    {
    }

    public function of(User $user): ProfileView
    {
        return ProfileView::of($user, $user->isParent() ? $this->students->findOneByParent($user) : null);
    }
}
