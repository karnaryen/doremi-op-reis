import { useParams } from 'react-router'

/** The `:studentId` of the URL as a number, or `null` if it is not a number. */
export function useStudentId(): number | null {
  const id = Number(useParams().studentId)
  return Number.isInteger(id) && id > 0 ? id : null
}
