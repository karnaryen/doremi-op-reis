<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * One file of a Material: a page of sheet music or the audio example. The row is the metadata of an object in R2.
 *
 * The partial unique index allows only one audio example per Material:
 * it is unique only over the rows where purpose = 'audio_example'.
 * The condition is written the way PostgreSQL saves it (with the casts to text). With the short form
 * "purpose = 'audio_example'" Doctrine sees a difference at every schema check and wants to make the index again.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(name: 'uniq_material_audio_example', columns: ['material_id'], options: ['where' => "((purpose)::text = 'audio_example'::text)"])]
class MaterialFile
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Material::class, inversedBy: 'files')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Material $material;

    #[ORM\Column(length: 20, enumType: MaterialFilePurpose::class)]
    private MaterialFilePurpose $purpose;

    /** Page order of sheet music, from 1. Null for the audio example. */
    #[ORM\Column(nullable: true)]
    private ?int $position;

    #[ORM\Embedded(class: StoredObject::class, columnPrefix: false)]
    private StoredObject $file;

    public function __construct(Material $material, MaterialFilePurpose $purpose, StoredObject $file, ?int $position)
    {
        $this->material = $material;
        $this->purpose = $purpose;
        $this->file = $file;
        $this->position = $position;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMaterial(): Material
    {
        return $this->material;
    }

    public function getPurpose(): MaterialFilePurpose
    {
        return $this->purpose;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function getFile(): StoredObject
    {
        return $this->file;
    }
}
