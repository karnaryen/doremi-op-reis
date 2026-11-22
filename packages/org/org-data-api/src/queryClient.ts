import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { HttpError } from './http'

type Options = {
  /**
   * Called when the API answers 401 to any query or mutation: the session has ended.
   * The app uses it to forget the signed-in user.
   */
  onUnauthorized?: (client: QueryClient) => void
}

export function createQueryClient({ onUnauthorized }: Options = {}) {
  const handle = (error: unknown) => {
    if (error instanceof HttpError && error.status === 401) onUnauthorized?.(client)
  }

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handle }),
    mutationCache: new MutationCache({ onError: handle }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // An answer of the API (4xx) is final: only a network error or a server error is tried again.
        retry: (failureCount, error) =>
          failureCount < 1 && !(error instanceof HttpError && error.status < 500),
        refetchOnWindowFocus: false,
      },
    },
  })

  return client
}
