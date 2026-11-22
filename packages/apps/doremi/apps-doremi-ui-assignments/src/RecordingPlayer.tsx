import { useState } from 'react'
import { useLingui } from '@lingui/react/macro'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import type { RecordingKind } from './types'

type Props = {
  kind: RecordingKind
  /**
   * A short-lived link to the file. `undefined` while the link is loading.
   * The link changes when it is renewed (about every 45 minutes); the file is the same.
   */
  src: string | undefined
}

/**
 * Plays a recording with the player of the browser.
 * `playsInline`: an iPhone plays the video in the page and does not switch to full screen.
 * `preload="metadata"`: the browser loads the length, not the whole file, until the user presses play.
 *
 * The player keeps the first link it got. A new `src` would make the browser load the file again
 * and lose the position of a paused recording. It takes the newest link only when loading fails,
 * which is what happens when the old link has expired.
 * For a new recording, give the player a new `key`: it then starts with the new link.
 */
export function RecordingPlayer({ kind, src }: Props) {
  const { t } = useLingui()
  const [current, setCurrent] = useState(src)

  // The first link has arrived. Changing state while rendering is the React way to follow a prop
  // without an effect: https://react.dev/learn/you-might-not-need-an-effect
  if (current === undefined && src !== undefined) setCurrent(src)

  if (!current) {
    return <Skeleton variant="rounded" height={kind === 'video' ? 200 : 54} />
  }

  const retryWithNewestLink = () => {
    if (src && src !== current) setCurrent(src)
  }

  return kind === 'video' ? (
    <Box
      component="video"
      controls
      playsInline
      preload="metadata"
      src={current}
      onError={retryWithNewestLink}
      aria-label={t`Video recording`}
      sx={{ width: '100%', maxHeight: '70dvh', borderRadius: 1, bgcolor: 'common.black' }}
    />
  ) : (
    <Box
      component="audio"
      controls
      preload="metadata"
      src={current}
      onError={retryWithNewestLink}
      aria-label={t`Audio recording`}
      sx={{ width: '100%' }}
    />
  )
}
