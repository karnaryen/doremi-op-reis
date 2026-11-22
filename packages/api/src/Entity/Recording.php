<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * The video or the audio of a Submission. The row is the metadata of an object in R2.
 * UNIQUE (submission_id, kind): a Submission has at most one video and one audio.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(name: 'uniq_recording_submission_kind', columns: ['submission_id', 'kind'])]
class Recording
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Submission::class, inversedBy: 'recordings')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Submission $submission;

    #[ORM\Column(length: 10, enumType: RecordingKind::class)]
    private RecordingKind $kind;

    #[ORM\Embedded(class: StoredObject::class, columnPrefix: false)]
    private StoredObject $file;

    public function __construct(Submission $submission, RecordingKind $kind, StoredObject $file)
    {
        $this->submission = $submission;
        $this->kind = $kind;
        $this->file = $file;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSubmission(): Submission
    {
        return $this->submission;
    }

    public function getKind(): RecordingKind
    {
        return $this->kind;
    }

    public function getFile(): StoredObject
    {
        return $this->file;
    }

    /** @return string the storage key of the old file */
    public function replaceFile(StoredObject $file): string
    {
        $oldKey = $this->file->objectKey;
        $this->file = $file;

        return $oldKey;
    }
}
