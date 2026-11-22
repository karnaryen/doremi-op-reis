import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpError, UploadError } from '@doremi/org-data-api'
import { uploadRecording } from './mutations'

/** A fake of the browser's XMLHttpRequest: records the upload and answers with `status`. */
function stubStorage(status: number) {
  const uploads: { method: string; url: string; contentType: string; body: unknown }[] = []

  class FakeXhr {
    status = 0
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null }
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    onabort: (() => void) | null = null
    private method = ''
    private url = ''
    private contentType = ''

    open(method: string, url: string) {
      this.method = method
      this.url = url
    }

    setRequestHeader(name: string, value: string) {
      if (name === 'Content-Type') this.contentType = value
    }

    send(body: unknown) {
      uploads.push({ method: this.method, url: this.url, contentType: this.contentType, body })
      this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 2 } as ProgressEvent)
      this.status = status
      if (status === 0) this.onerror?.()
      else this.onload?.()
    }

    abort() {
      this.onabort?.()
    }
  }

  vi.stubGlobal('XMLHttpRequest', FakeXhr)
  return uploads
}

function stubApi(answers: Record<string, Response>) {
  const calls: { key: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input, init) => {
      const key = `${init?.method ?? 'GET'} ${String(input)}`
      calls.push({ key, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined })
      const answer = answers[key]
      if (!answer) throw new Error(`Unexpected request: ${key}`)
      return answer
    }),
  )
  return calls
}

const video = new File(['the video'], 'minuet.mov', { type: 'video/quicktime' })
const target = {
  uploadId: 'abc',
  uploadUrl: 'https://storage.test/uploads/abc?upload',
  expiresIn: 900,
}

afterEach(() => vi.unstubAllGlobals())

describe('uploadRecording', () => {
  it('asks for a URL, sends the file to the storage and confirms the upload', async () => {
    const saved = { id: 7, status: 'sent' }
    const calls = stubApi({
      'POST /api/assignments/7/recordings/upload-url': Response.json(target),
      'POST /api/assignments/7/recordings': Response.json(saved),
    })
    const uploads = stubStorage(200)
    const onProgress = vi.fn()

    await expect(uploadRecording(7, { kind: 'video', file: video, onProgress })).resolves.toEqual(
      saved,
    )

    expect(calls).toEqual([
      {
        key: 'POST /api/assignments/7/recordings/upload-url',
        body: { kind: 'video', mimeType: 'video/quicktime', size: video.size },
      },
      { key: 'POST /api/assignments/7/recordings', body: { kind: 'video', uploadId: 'abc' } },
    ])
    // The file goes to the signed URL of the storage, with its type, and not to our API.
    expect(uploads).toEqual([
      { method: 'PUT', url: target.uploadUrl, contentType: 'video/quicktime', body: video },
    ])
    expect(onProgress).toHaveBeenCalledWith(0.5)
  })

  it('does not confirm when the storage refuses the file', async () => {
    const calls = stubApi({
      'POST /api/assignments/7/recordings/upload-url': Response.json(target),
    })
    stubStorage(403)

    await expect(uploadRecording(7, { kind: 'video', file: video })).rejects.toBeInstanceOf(
      UploadError,
    )
    // No third request: the API saves a recording only after a confirmed upload,
    // so the previous recording stays as it was.
    expect(calls).toHaveLength(1)
  })

  it('does not upload when the API refuses the file', async () => {
    stubApi({
      'POST /api/assignments/7/recordings/upload-url': Response.json(
        { error: 'file_not_accepted', message: 'The file is empty or larger than 200 MB.' },
        { status: 422 },
      ),
    })
    const uploads = stubStorage(200)

    const error: unknown = await uploadRecording(7, { kind: 'video', file: video }).catch(
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(HttpError)
    expect((error as HttpError).code).toBe('file_not_accepted')
    expect(uploads).toHaveLength(0)
  })
})
