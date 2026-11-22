/** A file could not be sent to the storage. `status` is 0 when there was no answer (no network). */
export class UploadError extends Error {
  readonly status: number

  constructor(status: number) {
    super(
      status === 0
        ? 'The upload did not reach the storage.'
        : `The storage refused the upload: ${status}.`,
    )
    this.name = 'UploadError'
    this.status = status
  }
}

export type UploadOptions = {
  /** Called with a number from 0 to 1 while the file is sent. */
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

/**
 * Sends a file with HTTP PUT to a signed URL of the file storage. The file does not pass through our API.
 *
 * `XMLHttpRequest` and not `fetch`: only it reports the progress of an upload, and a video on a mobile network
 * needs a progress bar. No cookies are sent: the signature in the URL is the permission.
 */
export function uploadToSignedUrl(
  url: string,
  file: Blob,
  { onProgress, signal }: UploadOptions = {},
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    // The storage saves this type with the object, and the API checks it after the upload.
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new UploadError(xhr.status))
    }
    xhr.onerror = () => reject(new UploadError(0))
    xhr.onabort = () => reject(new DOMException('The upload was cancelled.', 'AbortError'))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    if (signal?.aborted) xhr.abort()
    else xhr.send(file)
  })
}
