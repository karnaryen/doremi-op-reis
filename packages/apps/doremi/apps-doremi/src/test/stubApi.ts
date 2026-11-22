import { vi } from 'vitest'

type Answer = unknown | ((body: unknown) => unknown)

/** An answer with another status than 200: `status(401, { error: 'invalid_credentials' })`. */
export function status(code: number, body: unknown = null) {
  return new Response(body === null ? null : JSON.stringify(body), { status: code })
}

/**
 * Replaces `fetch` for one test. `answers` maps "METHOD /path" to the JSON answer, to a `Response`
 * (see `status`), or to a function that gets the JSON body of the request.
 * A request that is not in the map fails the test: no test calls a real API.
 * Returns the list of calls, to check what the app has sent.
 */
export function stubApi(answers: Record<string, Answer>) {
  const calls: { key: string; body: unknown }[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const key = `${init?.method ?? 'GET'} ${url}`
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
      calls.push({ key, body })

      if (!(key in answers)) throw new Error(`Unexpected request in a test: ${key}`)
      const answer = answers[key]
      const value: unknown =
        typeof answer === 'function' ? (answer as (b: unknown) => unknown)(body) : answer
      return value instanceof Response ? value : Response.json(value)
    }),
  )

  return calls
}

/**
 * Replaces `XMLHttpRequest` for one test: it plays the file storage that gets a file through a signed URL.
 * `answer` is the HTTP status of the storage; 0 means "no answer" (no network).
 * Returns the list of uploads.
 */
export function stubStorage(answer: number) {
  const uploads: { url: string; body: unknown }[] = []

  class FakeXhr {
    status = 0
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null }
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    onabort: (() => void) | null = null
    private url = ''

    open(_method: string, url: string) {
      this.url = url
    }

    setRequestHeader() {}

    send(body: unknown) {
      uploads.push({ url: this.url, body })
      this.status = answer
      // Like a real request: the answer comes later, not inside send().
      queueMicrotask(() => (answer === 0 ? this.onerror?.() : this.onload?.()))
    }

    abort() {
      this.onabort?.()
    }
  }

  vi.stubGlobal('XMLHttpRequest', FakeXhr)
  return uploads
}
