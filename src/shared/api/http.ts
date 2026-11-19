import { env } from '@/shared/config/env'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/** Minimal JSON fetch wrapper. Use inside TanStack Query `queryFn`s. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new HttpError(res.status, res.statusText)
  return (await res.json()) as T
}
