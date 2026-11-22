import { setSession } from '@doremi/apps-doremi-data-profile'
import { createQueryClient } from '@doremi/org-data-api'

/** The query client of the app. Any 401 answer means the session has ended: forget the user. */
export function createAppQueryClient() {
  return createQueryClient({ onUnauthorized: (client) => setSession(client, null) })
}
