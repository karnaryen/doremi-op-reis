import type { ReactNode } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@mui/material/Button'

type Props = {
  /** A short-lived link to the file. `undefined` while the link is loading: the button waits. */
  href: string | undefined
  icon: IconDefinition
  children: ReactNode
}

/**
 * Opens a private file in a new tab. It is a real link and not a click handler that loads the URL first:
 * a phone browser blocks a new tab that a script opens after a network request.
 * In the new tab the share menu of the phone prints the file or sends it by email.
 */
export function FileButton({ href, icon, children }: Props) {
  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      disabled={!href}
      startIcon={<FontAwesomeIcon icon={icon} fixedWidth />}
      sx={{ justifyContent: 'flex-start', minHeight: 48 }}
    >
      {children}
    </Button>
  )
}
