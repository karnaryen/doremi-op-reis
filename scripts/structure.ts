/**
 * The structure rules of the monorepo that ESLint and TypeScript cannot check:
 * where a package is, how it is named, which tags it has and how it lists its dependencies.
 * The rules are described in docs/tech/monorepo.md.
 *
 * This file has no file system code: `check-structure.ts` reads the files and calls these functions.
 */

export const SCOPE = '@doremi'

/** Folders in `packages/` with generic code. The folder decides the platform tag. */
const GENERIC_GROUPS = ['common', 'web', 'native'] as const
const PLATFORMS: readonly string[] = GENERIC_GROUPS
/** Package types that exist everywhere. `module` and the app itself exist only in `packages/apps`. */
const LIBRARY_TYPES = ['data', 'ui', 'utils']
const APP_LIBRARY_TYPES = [...LIBRARY_TYPES, 'module']
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

/** What the check needs to know about one package folder. */
export interface PackageFacts {
  /** Path from the repository root, for example `packages/web/web-utils-router`. */
  dir: string
  /** The parsed `package.json`, or `null` if the folder has none. */
  manifest: unknown
  hasReadme: boolean
  /** `src/index.ts` exists. */
  hasIndex: boolean
  /** The folder has at least one `*.test.ts` or `*.test.tsx` file. */
  hasTests: boolean
  /** `compilerOptions.lib` of `tsconfig.json`, or `null` if it is not set or the file cannot be read. */
  tsconfigLib: string[] | null
}

/**
 * The scripts that every package has, with their exact text.
 * `eslint .` matters: it also lints package.json, where the dependency rule works. `eslint src` would skip it.
 */
const REQUIRED_SCRIPTS = { typecheck: 'tsc -p tsconfig.json', lint: 'eslint .' }
/** Folder names are lower-case words with hyphens: they become a part of the package name. */
const NAME = '[a-z0-9]+(-[a-z0-9]+)*'

/** What the location of a package says about it. */
interface Expected {
  folder: string
  isApplication: boolean
  type: string
  layer: string
  /** `null`: the folder does not decide the platform (packages in `org` and `apps`). */
  platform: string | null
  app: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `web-utils-router` → `utils`, if the name is `<prefix>-<type>-<name>` with an allowed type. */
function typeFromName(folder: string, prefix: string, types: readonly string[]): string | null {
  const match = new RegExp(`^${prefix}-(${types.join('|')})-${NAME}$`).exec(folder)
  return match?.[1] ?? null
}

/** Reads the rules for a package from its path. Returns a problem text if the path breaks a rule. */
function expectedFor(dir: string): Expected | string {
  const parts = dir.split('/')
  const [root, group] = parts

  if (root !== 'packages' || group === undefined) {
    return 'a package must be in packages/'
  }

  if (group === 'apps') {
    const [, , app, folder] = parts
    if (parts.length !== 4 || app === undefined || folder === undefined) {
      return 'an app package must be in packages/apps/<app>/<package>'
    }
    if (!new RegExp(`^${NAME}$`).test(app)) {
      return `the app folder name "${app}" must be lower-case words with hyphens`
    }
    const common = { folder, layer: 'layer:app', platform: null, app: `app:${app}` }
    if (folder === `apps-${app}`) {
      return { ...common, isApplication: true, type: 'type:app' }
    }
    const type = typeFromName(folder, `apps-${app}`, APP_LIBRARY_TYPES)
    if (type === null) {
      return `the folder name must be apps-${app} or apps-${app}-<${APP_LIBRARY_TYPES.join('|')}>-<name>`
    }
    return { ...common, isApplication: false, type: `type:${type}` }
  }

  const isGeneric = PLATFORMS.includes(group)
  if (!isGeneric && group !== 'org') {
    return `unknown folder packages/${group}: use ${[...GENERIC_GROUPS, 'org', 'apps'].join(', ')}`
  }
  const folder = parts[2]
  if (parts.length !== 3 || folder === undefined) {
    return `a package must be in packages/${group}/<package>`
  }
  const type = typeFromName(folder, group, LIBRARY_TYPES)
  if (type === null) {
    return `the folder name must be ${group}-<${LIBRARY_TYPES.join('|')}>-<name>`
  }
  return {
    folder,
    isApplication: false,
    type: `type:${type}`,
    layer: isGeneric ? 'layer:generic' : 'layer:org',
    platform: isGeneric ? `platform:${group}` : null,
    app: null,
  }
}

function checkTags(tags: unknown, expected: Expected): string[] {
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
    return ['nx.tags must be a list of strings']
  }
  const problems: string[] = []
  const ofKind = (kind: string) => tags.filter((tag: string) => tag.startsWith(`${kind}:`))

  const platforms = ofKind('platform')
  const platform = platforms[0]
  if (platforms.length !== 1 || platform === undefined) {
    problems.push('nx.tags must have exactly one platform: tag')
  } else if (expected.platform !== null && platform !== expected.platform) {
    problems.push(`the platform tag must be ${expected.platform}, not ${platform}`)
  } else if (!PLATFORMS.includes(platform.slice('platform:'.length))) {
    problems.push(`unknown tag ${platform}`)
  }

  const fixed: [kind: string, tag: string | null][] = [
    ['layer', expected.layer],
    ['type', expected.type],
    ['app', expected.app],
  ]
  for (const [kind, tag] of fixed) {
    const found = ofKind(kind)
    if (tag === null) {
      if (found.length > 0) problems.push(`only app packages have an ${kind}: tag`)
    } else if (found.length !== 1 || found[0] !== tag) {
      problems.push(`nx.tags must have exactly one ${kind}: tag, and it must be ${tag}`)
    }
  }

  const known = ['platform:', 'layer:', 'type:', 'app:']
  for (const tag of tags as string[]) {
    if (!known.some((prefix) => tag.startsWith(prefix))) problems.push(`unknown tag ${tag}`)
  }
  return problems
}

/**
 * Every dependency of a workspace package is `workspace:*`; every other one is `catalog:`,
 * so the version is written once, in the catalog of pnpm-workspace.yaml.
 */
function checkDependencies(manifest: Record<string, unknown>): string[] {
  const problems: string[] = []
  for (const section of DEPENDENCY_SECTIONS) {
    const dependencies = manifest[section]
    if (dependencies === undefined) continue
    if (!isRecord(dependencies)) {
      problems.push(`${section} must be an object`)
      continue
    }
    for (const [name, version] of Object.entries(dependencies)) {
      const wanted = name.startsWith(`${SCOPE}/`) ? 'workspace:*' : 'catalog:'
      if (version !== wanted) {
        problems.push(`${section}: "${name}" must be "${wanted}", not ${JSON.stringify(version)}`)
      }
    }
  }
  return problems
}

/** Problems of one package folder. An empty list: the package follows the rules. */
export function checkPackage(facts: PackageFacts): string[] {
  const expected = expectedFor(facts.dir)
  if (typeof expected === 'string') return [expected]

  const { manifest } = facts
  if (!isRecord(manifest)) {
    return [
      'package.json is missing or is not an object (a leftover folder of a deleted package? delete it)',
    ]
  }

  const problems: string[] = []
  const name = `${SCOPE}/${expected.folder}`
  if (manifest.name !== name) problems.push(`the package name must be ${name}`)
  // A public package could be published to npm by mistake.
  if (manifest.private !== true) problems.push('"private" must be true')

  const nx = isRecord(manifest.nx) ? manifest.nx : {}
  const projectType = expected.isApplication ? 'application' : 'library'
  if (nx.projectType !== projectType) problems.push(`nx.projectType must be ${projectType}`)
  problems.push(...checkTags(nx.tags, expected))

  // One public entry: other packages cannot import a file from inside the package.
  if (!expected.isApplication) {
    const { exports } = manifest
    const hasOneEntry =
      isRecord(exports) && Object.keys(exports).length === 1 && exports['.'] === './src/index.ts'
    if (!hasOneEntry) problems.push('"exports" must be { ".": "./src/index.ts" }')
    if (!facts.hasIndex) problems.push('src/index.ts is missing')
  }

  // `nx run-many` skips a package that has no script with the name of the target.
  const scripts = isRecord(manifest.scripts) ? manifest.scripts : {}
  for (const [script, command] of Object.entries(REQUIRED_SCRIPTS)) {
    if (scripts[script] !== command) problems.push(`the "${script}" script must be "${command}"`)
  }
  if (facts.hasTests && typeof scripts.test !== 'string') {
    problems.push('the package has test files but no "test" script, so the tests never run')
  }

  // Common code is type-checked without the browser types (docs/tech/monorepo.md).
  if (Array.isArray(nx.tags) && nx.tags.includes('platform:common')) {
    const lib = facts.tsconfigLib
    if (lib === null) {
      problems.push(
        'a platform:common package must set "lib" in tsconfig.json, without DOM (the check reads plain JSON: no comments)',
      )
    } else if (lib.some((entry) => entry.toLowerCase().startsWith('dom'))) {
      problems.push('a platform:common package must not have DOM in the "lib" of tsconfig.json')
    }
  }

  if (!facts.hasReadme) problems.push('README.md is missing')
  problems.push(...checkDependencies(manifest))
  return problems
}

/** Problems of the root `package.json`. It has only the tools of the whole repository. */
export function checkRootManifest(manifest: unknown): string[] {
  if (!isRecord(manifest)) return ['package.json is not an object']
  const problems: string[] = []
  if (manifest.dependencies !== undefined) {
    problems.push(
      'the root package.json must not have "dependencies": a library belongs to the package that imports it',
    )
  }
  problems.push(...checkDependencies(manifest))
  return problems
}

/**
 * Finds libraries that two workspace packages depend on directly and resolve in two different ways.
 *
 * With per-package dependencies, pnpm resolves each package on its own. If two packages get
 * two copies of `react` or `@mui/material`, the app has two React contexts and breaks at runtime,
 * and neither TypeScript nor a unit test of one package sees it.
 *
 * Reads the `importers` section of pnpm-lock.yaml (one entry per workspace package), so it sees
 * only direct dependencies. It skips `devDependencies`: two copies of a test tool do no harm. It reads the text line by line; if it finds nothing to compare,
 * the format has changed, and it reports that instead of saying "no problems".
 */
export function checkLockfile(lockfile: string): string[] {
  /** Library name → resolved version → the packages that got this version. */
  const resolved = new Map<string, Map<string, string[]>>()
  let inImporters = false
  let importer = ''
  let section = ''
  let dependency = ''

  let importerCount = 0
  let versionCount = 0

  for (const line of lockfile.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inImporters = line.startsWith('importers:')
      continue
    }
    if (!inImporters) continue

    const unquote = (text: string) => text.replace(/^'(.*)'$/, '$1')
    const importerMatch = /^ {2}(\S.*):$/.exec(line)
    const sectionMatch = /^ {4}(\S.*):$/.exec(line)
    const dependencyMatch = /^ {6}(\S.*):$/.exec(line)
    const versionMatch = /^ {8}version: (.+)$/.exec(line)

    if (importerMatch?.[1] !== undefined) {
      importer = unquote(importerMatch[1])
      importerCount += 1
    } else if (sectionMatch?.[1] !== undefined) {
      section = sectionMatch[1]
    } else if (dependencyMatch?.[1] !== undefined) {
      dependency = unquote(dependencyMatch[1])
    } else if (versionMatch?.[1] !== undefined) {
      const version = unquote(versionMatch[1])
      versionCount += 1
      // A workspace package is a link to its folder, not a copy.
      if (version.startsWith('link:') || section === 'devDependencies') continue
      const versions = resolved.get(dependency) ?? new Map<string, string[]>()
      versions.set(version, [...(versions.get(version) ?? []), importer])
      resolved.set(dependency, versions)
    }
  }

  // Every workspace package is an importer, and the root has at least its tools.
  if (importerCount === 0 || versionCount === 0) {
    return ['cannot read the "importers" section: has the format of pnpm-lock.yaml changed?']
  }

  const problems: string[] = []
  for (const [name, versions] of resolved) {
    if (versions.size < 2) continue
    const list = [...versions]
      .map(([version, importers]) => `\n    ${version}\n      in ${importers.join(', ')}`)
      .join('')
    problems.push(`"${name}" is resolved in ${versions.size} different ways:${list}`)
  }
  return problems
}
