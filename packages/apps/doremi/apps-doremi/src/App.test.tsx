import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteLink } from '@doremi/apps-doremi-utils-routes'
import { useLocaleStore } from '@doremi/org-utils-i18n'
import { AppProviders } from './providers/AppProviders'
import { parent, renderRoute, sessionClient, teacher } from './test/renderRoute'
import { status, stubApi, stubStorage } from './test/stubApi'

afterEach(() => {
  vi.unstubAllGlobals()
  useLocaleStore.getState().setLocale('en')
})

const fileInputs = () => [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')]

const assignment = {
  id: 7,
  title: 'Minuet in G',
  status: 'sent',
  studentId: 3,
  studentName: 'Charlie',
  createdAt: '2026-11-20T10:00:00+00:00',
  submittedAt: '2026-11-21T10:00:00+00:00',
  completedAt: null,
  deleteAt: null,
  generalInstruction: 'Play slowly.',
  personalInstruction: null,
  parentHint: 'Count aloud together.',
  materialFiles: [],
  recordings: [],
  feedback: null,
  version: 4,
}

describe('routing', () => {
  it('renders the home page for a guest', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Doremi op reis' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
    expect(screen.getByRole('link', { name: 'I am a teacher: create an account' })).toHaveAttribute(
      'href',
      '/sign-up',
    )
  })

  it('shows the design-system sections on the developer page', async () => {
    renderRoute('/design-system')
    for (const name of [
      'Color',
      'Typography',
      'Actions',
      'Inputs',
      'Feedback and navigation',
      'Cards',
    ]) {
      expect(await screen.findByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  it('keeps an accessible name on the logo link', async () => {
    renderRoute('/')
    expect(await screen.findByRole('link', { name: 'Doremi op reis' })).toBeInTheDocument()
  })

  it('navigates to the lazy about page', async () => {
    renderRoute('/')
    await userEvent.click(await screen.findByRole('link', { name: 'About' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeVisible()
  })

  it('changes the language on the profile page', async () => {
    renderRoute('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Profile' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()

    await userEvent.click(screen.getByRole('radio', { name: 'Nederlands' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profiel' })).toBeVisible()

    await userEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
  })

  it('shows 404 for unknown routes', async () => {
    renderRoute('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})

describe('access', () => {
  it('shows a guest the sections Home and Profile, not Main', async () => {
    renderRoute('/')
    expect(await screen.findByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Main' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Students' })).not.toBeInTheDocument()
  })

  it.each([teacher, parent])('does not show Home to a signed-in $role', async (profile) => {
    renderRoute('/profile', { profile })

    expect(await screen.findByRole('link', { name: 'Main' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeVisible()
  })

  it('shows the section Students to a teacher only', async () => {
    renderRoute('/profile', { profile: teacher })
    expect(await screen.findByRole('link', { name: 'Students' })).toBeInTheDocument()
  })

  it('sends a guest who opens a teacher URL to the sign-in page', async () => {
    const { router } = renderRoute('/teacher/active')

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/sign-in')
    // The sign-in page sends the user back to this page afterwards.
    expect(router.state.location.state).toEqual({ from: '/teacher/active' })
  })

  it('sends a signed-in user from the homepage to Main', async () => {
    stubApi({ 'GET /api/assignments?filter=to_review': [] })
    const { router } = renderRoute('/', { profile: teacher })

    expect(await screen.findByRole('tab', { name: 'To review', selected: true })).toBeVisible()
    expect(router.state.location.pathname).toBe('/teacher/to-review')
    expect(await screen.findByText('No recordings to review.')).toBeVisible()
  })

  it('lets a teacher open a teacher URL directly', async () => {
    stubApi({ 'GET /api/assignments?filter=active': [assignment] })
    renderRoute('/teacher/active', { profile: teacher })

    expect(await screen.findByRole('link', { name: /Minuet in G/ })).toHaveAttribute(
      'href',
      '/teacher/assignments/7',
    )
    expect(screen.getByRole('tab', { name: 'Active', selected: true })).toBeVisible()
    expect(screen.getByText('Charlie')).toBeVisible()
  })

  it('opens the first tab of the parent section, with the name of the child', async () => {
    stubApi({ 'GET /api/assignments?filter=active': [assignment] })
    const { router } = renderRoute('/parent', { profile: parent })

    expect(await screen.findByRole('tab', { name: 'Active', selected: true })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Completed' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Pieces of Charlie' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/parent/active')
    expect(await screen.findByRole('link', { name: /Minuet in G/ })).toHaveAttribute(
      'href',
      '/parent/assignments/7',
    )
  })

  it('shows 404 when a parent opens a teacher URL', async () => {
    renderRoute('/teacher/to-review', { profile: parent })

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
    expect(screen.queryByRole('tab', { name: 'To review' })).not.toBeInTheDocument()
  })

  it('shows breadcrumbs only below a section', async () => {
    stubApi({ 'GET /api/assignments?filter=completed': [] })
    renderRoute('/teacher/completed', { profile: teacher })

    const crumbs = await screen.findByRole('navigation', { name: 'Breadcrumbs' })
    expect(within(crumbs).getByRole('link', { name: 'Main' })).toHaveAttribute('href', '/teacher')
    expect(within(crumbs).getByText('Completed')).toHaveAttribute('aria-current', 'page')
  })

  it('shows no breadcrumbs on a top-level page', async () => {
    renderRoute('/profile')

    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Breadcrumbs' })).not.toBeInTheDocument()
  })
})

describe('sign-in', () => {
  it('signs a teacher in and opens Main', async () => {
    const calls = stubApi({
      'POST /api/login': teacher,
      'GET /api/assignments?filter=to_review': [],
    })
    const { router } = renderRoute('/sign-in')

    await userEvent.type(await screen.findByLabelText(/Email/), ' tessa@example.test ')
    await userEvent.type(screen.getByLabelText(/Password/), 'correct horse battery')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('tab', { name: 'To review', selected: true })).toBeVisible()
    expect(router.state.location.pathname).toBe('/teacher/to-review')
    expect(calls[0]).toEqual({
      key: 'POST /api/login',
      body: { email: 'tessa@example.test', password: 'correct horse battery' },
    })
  })

  it('goes back to the page that the guest wanted to open', async () => {
    stubApi({ 'POST /api/login': teacher, 'GET /api/students': [] })
    const { router } = renderRoute('/students')
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

    await userEvent.type(screen.getByLabelText(/Email/), 'tessa@example.test')
    await userEvent.type(screen.getByLabelText(/Password/), 'correct horse battery')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Students' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/students')
  })

  it('shows a translated message for a wrong password', async () => {
    stubApi({ 'POST /api/login': status(401, { error: 'invalid_credentials', message: 'x' }) })
    renderRoute('/sign-in')

    await userEvent.type(await screen.findByLabelText(/Email/), 'tessa@example.test')
    await userEvent.type(screen.getByLabelText(/Password/), 'wrong password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or the password is not correct.',
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
  })

  it('signs out and shows the homepage of a guest', async () => {
    const calls = stubApi({ 'POST /api/logout': status(204) })
    const { router } = renderRoute('/profile', { profile: parent })

    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Doremi op reis' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
    expect(screen.queryByRole('link', { name: 'Main' })).not.toBeInTheDocument()
    expect(calls.map((call) => call.key)).toEqual(['POST /api/logout'])
  })

  it('forgets the user when the API says that the session has ended', async () => {
    stubApi({ 'GET /api/assignments?filter=active': status(401, { error: 'unauthorized' }) })
    const { router } = renderRoute('/parent/active', { profile: parent })

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/sign-in')
  })

  it('asks for a new link when the invitation link has no token', async () => {
    renderRoute('/set-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('This link is not complete.')
    expect(screen.queryByLabelText(/New password/)).not.toBeInTheDocument()
  })

  it('lets a parent choose a password with the token of the link', async () => {
    const token = 'a'.repeat(64)
    const calls = stubApi({
      'POST /api/invitations/accept': parent,
      'GET /api/assignments?filter=active': [],
    })
    const { router } = renderRoute(`/set-password#token=${token}`)

    await userEvent.type(await screen.findByLabelText(/New password/), 'a new long password')
    await userEvent.click(screen.getByRole('button', { name: 'Save password and sign in' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pieces of Charlie' }),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/parent/active')
    expect(calls[0]?.body).toEqual({ token, password: 'a new long password' })
  })
})

describe('invitation', () => {
  it('lets a signed-in user accept an invitation, and says who is signed in now', async () => {
    const token = 'b'.repeat(64)
    stubApi({
      'POST /api/invitations/accept': parent,
      'GET /api/assignments?filter=active': [],
    })
    // The teacher tries the invitation link on their own phone.
    const { router } = renderRoute(`/set-password#token=${token}`, { profile: teacher })

    expect(await screen.findByText(/signed in as Tessa Teacher/)).toBeVisible()
    await userEvent.type(screen.getByLabelText(/New password/), 'a new long password')
    await userEvent.click(screen.getByRole('button', { name: 'Save password and sign in' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pieces of Charlie' }),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/parent/active')
  })
})

describe('teacher', () => {
  it('needs feedback before a review is sent', async () => {
    const calls = stubApi({
      'GET /api/assignments/7': assignment,
      'POST /api/assignments/7/review': { ...assignment, status: 'completed' },
    })
    renderRoute('/teacher/assignments/7', { profile: teacher })

    await userEvent.click(await screen.findByRole('button', { name: 'Complete' }))
    expect(await screen.findByText(/Write feedback first/)).toBeVisible()
    expect(calls.map((call) => call.key)).toEqual(['GET /api/assignments/7'])

    await userEvent.type(screen.getByLabelText(/Feedback for the student/), ' Well done! ')
    await userEvent.click(screen.getByRole('button', { name: 'Complete' }))

    // The completed piece has no review form any more.
    await screen.findByText('Completed')
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument()
    expect(calls.at(-1)).toEqual({
      key: 'POST /api/assignments/7/review',
      // The version that the screen had: the API refuses the review if the piece has changed since.
      body: { action: 'complete', feedback: 'Well done!', version: 4 },
    })
  })

  it('adds a parent and says when the invitation email was not sent', async () => {
    const student = {
      id: 3,
      name: 'Charlie',
      parent: { id: 2, name: 'Paula Parent', email: 'paula@example.test', invitationPending: true },
    }
    const calls = stubApi({
      'POST /api/parents': { ...student, invitationSent: false },
      'GET /api/students/3': { ...student, assignments: [] },
    })
    const { router } = renderRoute('/students/add', { profile: teacher })

    await userEvent.type(await screen.findByLabelText(/Name of the parent/), 'Paula Parent')
    await userEvent.type(screen.getByLabelText(/Email of the parent/), 'paula@example.test')
    await userEvent.type(screen.getByLabelText(/Name of the child/), 'Charlie')
    await userEvent.click(screen.getByRole('button', { name: 'Add and send invitation' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Paula Parent' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/students/3/parent')
    expect(screen.getByText(/the invitation email could not be sent/)).toBeVisible()
    expect(calls[0]?.body).toEqual({
      name: 'Paula Parent',
      email: 'paula@example.test',
      childName: 'Charlie',
    })
  })
})

describe('teacher: students', () => {
  const student = {
    id: 3,
    name: 'Charlie',
    parent: { id: 2, name: 'Paula Parent', email: 'paula@example.test', invitationPending: false },
    assignments: [],
  }

  it('deletes a parent after a confirmation and goes back to the list', async () => {
    const calls = stubApi({
      'GET /api/students/3': student,
      'DELETE /api/parents/2': status(204),
      'GET /api/students': [],
    })
    const { router } = renderRoute('/students/3/parent', { profile: teacher })

    await userEvent.click(await screen.findByRole('button', { name: 'Delete parent' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete Paula Parent?' })
    expect(calls.map((call) => call.key)).toEqual(['GET /api/students/3'])
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/No students yet/)).toBeVisible()
    expect(router.state.location.pathname).toBe('/students')
    // The deleted student is not asked from the API again: that would show "does not exist".
    expect(calls.map((call) => call.key)).toEqual([
      'GET /api/students/3',
      'DELETE /api/parents/2',
      'GET /api/students',
    ])
  })

  it('refuses a PDF together with photos as sheet music', async () => {
    stubApi({ 'GET /api/students/3': student })
    renderRoute('/students/3/assign', { profile: teacher })
    await screen.findByRole('heading', { level: 1, name: 'Assign a piece' })

    const picker = document.querySelector<HTMLInputElement>('input[type="file"][multiple]')
    if (!picker) throw new Error('No file input for sheet music')
    await userEvent.upload(picker, [
      new File(['pdf'], 'minuet.pdf', { type: 'application/pdf' }),
      new File(['jpg'], 'page-2.jpg', { type: 'image/jpeg' }),
    ])

    expect(await screen.findByText(/A PDF and photos together are not possible/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Remove minuet.pdf' }))
    expect(screen.queryByText(/A PDF and photos together/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assign' })).toBeEnabled()
  })
})

describe('parent', () => {
  it('shows the piece card with the task first and the upload button', async () => {
    stubApi({
      'GET /api/assignments/7': {
        ...assignment,
        status: 'sent',
        feedback: {
          text: 'Slower, please.',
          updatedAt: '2026-11-20T10:00:00+00:00',
          forPreviousAttempt: true,
        },
      },
    })
    renderRoute('/parent/assignments/7', { profile: parent })

    expect(await screen.findByRole('heading', { level: 1, name: 'Minuet in G' })).toBeVisible()
    expect(screen.getByText('Play slowly.')).toBeVisible()
    expect(screen.getByText('Count aloud together.')).toBeVisible()
    // The feedback was written before the latest recording.
    expect(screen.getByText('Advice for the previous attempt')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Send a recording' })).toHaveAttribute(
      'href',
      '/parent/assignments/7/upload',
    )
  })

  it('sends a recording: API, storage, API, and then a confirmation', async () => {
    const calls = stubApi({
      'GET /api/assignments/7': assignment,
      'POST /api/assignments/7/recordings/upload-url': {
        uploadId: 'abc',
        uploadUrl: 'https://storage.test/uploads/abc?upload',
        expiresIn: 900,
      },
      'POST /api/assignments/7/recordings': { ...assignment, status: 'sent' },
    })
    const uploads = stubStorage(200)
    renderRoute('/parent/assignments/7/upload', { profile: parent })
    await screen.findByRole('heading', { level: 1, name: 'Send a recording' })

    const video = new File(['the video'], 'hands.mov', { type: 'video/quicktime' })
    await userEvent.upload(fileInputs()[1] as HTMLInputElement, video)
    expect(await screen.findByText(/Chosen: hands\.mov/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Send to the teacher' }))

    expect(await screen.findByText(/The recording is sent/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to the piece' })).toHaveAttribute(
      'href',
      '/parent/assignments/7',
    )
    expect(uploads).toEqual([{ url: 'https://storage.test/uploads/abc?upload', body: video }])
    expect(calls.at(-1)).toEqual({
      key: 'POST /api/assignments/7/recordings',
      body: { kind: 'video', uploadId: 'abc' },
    })
  })

  it('offers a retry when the upload fails, and keeps the chosen file', async () => {
    stubApi({
      'GET /api/assignments/7': assignment,
      'POST /api/assignments/7/recordings/upload-url': {
        uploadId: 'abc',
        uploadUrl: 'https://storage.test/uploads/abc?upload',
        expiresIn: 900,
      },
      'POST /api/assignments/7/recordings': { ...assignment, status: 'sent' },
    })
    // No network: the storage gives no answer.
    stubStorage(0)
    renderRoute('/parent/assignments/7/upload', { profile: parent })
    await screen.findByRole('heading', { level: 1, name: 'Send a recording' })

    await userEvent.upload(
      fileInputs()[1] as HTMLInputElement,
      new File(['the video'], 'hands.mov', { type: 'video/quicktime' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send to the teacher' }))

    expect(await screen.findByText(/The upload failed/)).toBeVisible()
    expect(screen.getByText(/Chosen: hands\.mov/)).toBeVisible()

    // The connection is back.
    stubStorage(200)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(/The recording is sent/)).toBeVisible()
  })

  it('shows the privacy notice on the upload screen', async () => {
    stubApi({ 'GET /api/assignments/7': assignment })
    renderRoute('/parent/assignments/7/upload', { profile: parent })

    expect(await screen.findByText('About your recordings')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Send to the teacher' })).toBeDisabled()
  })
})

describe('RouteLink', () => {
  function Links() {
    return (
      <>
        <RouteLink to="profile">to profile</RouteLink>
        <RouteLink to="teacher.active">to teacher</RouteLink>
      </>
    )
  }

  function renderLinks(profile: typeof teacher | null) {
    const router = createMemoryRouter([{ path: '/', element: <Links /> }])
    return render(
      <AppProviders queryClient={sessionClient(profile)}>
        <RouterProvider router={router} />
      </AppProviders>,
    )
  }

  it('does not draw a link the user may not open', () => {
    renderLinks(null)
    expect(screen.getByRole('link', { name: 'to profile' })).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('link', { name: 'to teacher' })).not.toBeInTheDocument()
  })

  it('draws the link when the role may open the route', () => {
    renderLinks(teacher)
    expect(screen.getByRole('link', { name: 'to teacher' })).toHaveAttribute(
      'href',
      '/teacher/active',
    )
  })
})

/** Never runs: the type checker reads it. Links to the route table are typed. */
export function TypedLinks() {
  return (
    <>
      <RouteLink to="teacher.toReview">ok</RouteLink>
      <RouteLink to="students.student" params={{ studentId: 1 }}>
        ok
      </RouteLink>
      {/* @ts-expect-error a route that is not in the table */}
      <RouteLink to="teacher.students">wrong</RouteLink>
      {/* @ts-expect-error this route has no parameters */}
      <RouteLink to="profile" params={{ id: 1 }}>
        wrong
      </RouteLink>
      {/* @ts-expect-error the parameter of this route is missing */}
      <RouteLink to="students.student">wrong</RouteLink>
    </>
  )
}
