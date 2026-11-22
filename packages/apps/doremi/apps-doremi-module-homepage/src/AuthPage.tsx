import type { FormEvent, ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

/** Must be the same as SignUpRequest::PASSWORD_MIN_LENGTH in packages/api. */
export const PASSWORD_MIN_LENGTH = 10

type Props = {
  title: ReactNode
  intro?: ReactNode
  onSubmit: () => void
  children: ReactNode
}

/**
 * The frame of the sign-in, sign-up and set-password screens: a title and one narrow form.
 * The fields use the validation of the browser (`required`, `type="email"`, `minLength`),
 * so its messages are in the language of the phone; the API checks every value again.
 */
export function AuthPage({ title, intro, onSubmit, children }: Props) {
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2.5} sx={{ maxWidth: 440, mx: 'auto' }}>
      <Typography variant="h3" component="h1">
        {title}
      </Typography>
      {intro && <Typography color="text.secondary">{intro}</Typography>}
      {children}
    </Stack>
  )
}

type PasswordFieldProps = Pick<TextFieldProps, 'label' | 'helperText'> & {
  value: string
  onChange: (value: string) => void
  /** `new-password` lets a password manager offer and save a new password. */
  autoComplete: 'current-password' | 'new-password'
}

export function PasswordField({ value, onChange, autoComplete, ...rest }: PasswordFieldProps) {
  return (
    <TextField
      {...rest}
      type="password"
      required
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      slotProps={{
        htmlInput: autoComplete === 'new-password' ? { minLength: PASSWORD_MIN_LENGTH } : {},
      }}
    />
  )
}
