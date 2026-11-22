import { Trans } from '@lingui/react/macro'
import { faFileLines, faMusic } from '@fortawesome/free-solid-svg-icons'
import Stack from '@mui/material/Stack'
import { FileButton } from './FileButton'

type Props = {
  files: readonly {
    id: number
    purpose: 'sheet_music' | 'audio_example'
    /** Page number of sheet music, from 1. */
    position: number | null
  }[]
  /** Short-lived links by file id. A missing link: the button waits. */
  links: Readonly<Record<number, string | undefined>>
}

/** The files of a piece: sheet music and the audio example. Each button opens the file in a new tab. */
export function MaterialFileList({ files, links }: Props) {
  const pages = files.filter((file) => file.purpose === 'sheet_music').length
  if (files.length === 0) return null

  return (
    <Stack spacing={1}>
      {files.map((file) => {
        const page = file.position
        return file.purpose === 'audio_example' ? (
          <FileButton key={file.id} href={links[file.id]} icon={faMusic}>
            <Trans>Audio example</Trans>
          </FileButton>
        ) : (
          <FileButton key={file.id} href={links[file.id]} icon={faFileLines}>
            {pages > 1 ? <Trans>Sheet music, page {page}</Trans> : <Trans>Sheet music</Trans>}
          </FileButton>
        )
      })}
    </Stack>
  )
}
