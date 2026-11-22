import { describe, expect, it } from 'vitest'
import { canAccess, createPathBuilder, fillPath, indexRoutes } from './routes'

const table = {
  home: { path: '' },
  teacher: {
    path: 'teacher',
    access: ['teacher'],
    index: 'toReview',
    children: {
      toReview: { path: 'to-review' },
      student: { path: 'students/:studentId', access: ['teacher', 'admin'] },
    },
  },
} as const

describe('indexRoutes', () => {
  const routes = indexRoutes(table)

  it('builds ids and full paths', () => {
    expect([...routes.keys()]).toEqual(['home', 'teacher', 'teacher.toReview', 'teacher.student'])
    expect(routes.get('home')?.fullPath).toBe('/')
    expect(routes.get('teacher.student')?.fullPath).toBe('/teacher/students/:studentId')
  })

  it('inherits access from the parent unless the child sets its own', () => {
    expect(routes.get('home')?.access).toBeNull()
    expect(routes.get('teacher.toReview')?.access).toEqual(['teacher'])
    expect(routes.get('teacher.student')?.access).toEqual(['teacher', 'admin'])
  })

  it('rejects an index that is not a child', () => {
    expect(() => indexRoutes({ a: { path: 'a', index: 'missing' } })).toThrow(/index child/)
  })
})

describe('canAccess', () => {
  const routes = indexRoutes(table)

  it('lets everyone open a route without access rules', () => {
    expect(canAccess(routes.get('home')!, 'guest')).toBe(true)
  })

  it('checks the role', () => {
    expect(canAccess(routes.get('teacher')!, 'teacher')).toBe(true)
    expect(canAccess(routes.get('teacher')!, 'parent')).toBe(false)
  })
})

describe('fillPath', () => {
  it('encodes parameters', () => {
    expect(fillPath('/a/:id', { id: 'x y' })).toBe('/a/x%20y')
  })

  it('throws when a parameter is missing', () => {
    expect(() => fillPath('/a/:id')).toThrow(/Missing route parameter "id"/)
  })
})

describe('createPathBuilder', () => {
  const pathTo = createPathBuilder(table)

  it('builds URLs', () => {
    expect(pathTo('home')).toBe('/')
    expect(pathTo('teacher.toReview')).toBe('/teacher/to-review')
    expect(pathTo('teacher.student', { studentId: 7 })).toBe('/teacher/students/7')
  })

  it('makes wrong links a type error', () => {
    // @ts-expect-error unknown route id
    expect(() => pathTo('teacher.missing')).toThrow()
    // @ts-expect-error missing parameter
    expect(() => pathTo('teacher.student')).toThrow()
    // @ts-expect-error wrong parameter name
    expect(() => pathTo('teacher.student', { id: 7 })).toThrow()
    // @ts-expect-error route has no parameters
    expect(pathTo('home', { id: 7 })).toBe('/')
  })
})
