<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A piece of music of one teacher: title, general instruction, sheet music and an audio example.
 *
 * It is separate from Assignment, so one Material can be given to many students,
 * and it stays when an Assignment is deleted (docs/tech/data-model.md).
 */
#[ORM\Entity]
class Material
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $teacher;

    #[ORM\Column(length: 200)]
    private string $title;

    /** For all students with this piece. Optional. */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $generalInstruction;

    /**
     * The files of the Material. cascade persist: saving the Material saves its new files too.
     *
     * @var Collection<int, MaterialFile>
     */
    #[ORM\OneToMany(targetEntity: MaterialFile::class, mappedBy: 'material', cascade: ['persist'])]
    #[ORM\OrderBy(['position' => 'ASC', 'id' => 'ASC'])]
    private Collection $files;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(User $teacher, string $title, ?string $generalInstruction, \DateTimeImmutable $now)
    {
        if (!$teacher->isTeacher()) {
            throw new \LogicException('A material belongs to a teacher.');
        }

        $this->teacher = $teacher;
        $this->title = $title;
        $this->generalInstruction = $generalInstruction;
        $this->createdAt = $now;
        $this->files = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTeacher(): User
    {
        return $this->teacher;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getGeneralInstruction(): ?string
    {
        return $this->generalInstruction;
    }

    /** @return list<MaterialFile> */
    public function getFiles(): array
    {
        return array_values($this->files->toArray());
    }

    /** A page of the sheet music. $position is the page number, from 1. */
    public function addSheetMusic(StoredObject $file, int $position): void
    {
        $this->files->add(new MaterialFile($this, MaterialFilePurpose::SheetMusic, $file, $position));
    }

    public function setAudioExample(StoredObject $file): void
    {
        foreach ($this->files as $existing) {
            if (MaterialFilePurpose::AudioExample === $existing->getPurpose()) {
                throw new \LogicException('This material already has an audio example.');
            }
        }

        $this->files->add(new MaterialFile($this, MaterialFilePurpose::AudioExample, $file, null));
    }
}
