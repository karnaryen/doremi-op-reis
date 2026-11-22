import { env } from './env'

/** One invalid field of a request, as the API reports it. */
export type Violation = { field: string; message: string }

/** The JSON body of every error answer of the API. */
type ErrorBody = { error?: unknown; message?: unknown; violations?: unknown }

/**
 * A request that the API refused. `code` is the stable error code of the API
 * (`email_already_used`, `validation_failed`, ...): show a translated text for it, not `message`.
 */
export class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly violations: readonly Violation[]

  constructor(
    status: number,
    message: string,
    code = 'request_failed',
    violations: Violation[] = [],
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.violations = violations
  }
}

function isViolation(value: unknown): value is Violation {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Violation).field === 'string' &&
    typeof (value as Violation).message === 'string'
  )
}

async function toHttpError(res: Response): Promise<HttpError> {
  let body: ErrorBody = {}
  try {
    body = (await res.json()) as ErrorBody
  } catch {
    // Not JSON, for example an error page of a proxy: the status is all we know.
  }
  return new HttpError(
    res.status,
    typeof body.message === 'string' ? body.message : res.statusText,
    typeof body.error === 'string' ? body.error : undefined,
    Array.isArray(body.violations) ? body.violations.filter(isViolation) : [],
  )
}

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  /** Sent as JSON. */
  body?: unknown
  signal?: AbortSignal
}

/**
 * JSON request to our API. Use inside TanStack Query `queryFn`s and `mutationFn`s.
 *
 * - `credentials: 'include'`: the browser sends the session cookie, also when the API has another origin.
 * - `Content-Type: application/json` on every request that changes data, also without a body: the API refuses
 *   such a request without it (its protection against CSRF). A GET has no such header: with it the browser
 *   would ask the API for permission before every GET from another origin (a CORS preflight request).
 * - An answer without content (204) resolves to `undefined`.
 */
export async function http<T>(path: string, { method = 'GET', body, signal }: HttpOptions = {}) {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw await toHttpError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
