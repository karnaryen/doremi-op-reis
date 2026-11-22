/**
 * Reads from the file system what the structure rules need (`structure.ts` has the rules).
 * Every function gets the repository root as a parameter, so a test can use a temporary folder.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PackageFacts } from './structure.ts'

/** Folders in `packages/` that are not pnpm packages. */
const NOT_PNPM_PACKAGES = ['api']
/** The file names that Vitest runs by default: https://vitest.dev/config/include */
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/

/** The parsed JSON file, or `null` if the file is missing or is not JSON. */
export function readJson(root: string, path: string): unknown {
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'))
  } catch {
    return null
  }
}

function folders(root: string, dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => `${dir}/${entry.name}`)
}

function hasTestFile(root: string, dir: string): boolean {
  return readdirSync(join(root, dir), { withFileTypes: true }).some((entry) => {
    if (entry.isDirectory()) {
      return entry.name !== 'node_modules' && hasTestFile(root, `${dir}/${entry.name}`)
    }
    return TEST_FILE.test(entry.name)
  })
}

function tsconfigLib(root: string, dir: string): string[] | null {
  const tsconfig = readJson(root, `${dir}/tsconfig.json`) as {
    compilerOptions?: { lib?: unknown }
  } | null
  const lib = tsconfig?.compilerOptions?.lib
  return Array.isArray(lib) ? lib.map(String) : null
}

/**
 * Every folder where a package can be: `packages/<group>/*` and `packages/apps/<app>/*`.
 * It lists all folders, not only the correct ones: the rules report a folder in a wrong place.
 */
export function packageDirs(root: string): string[] {
  return folders(root, 'packages')
    .filter((group) => !NOT_PNPM_PACKAGES.includes(group.slice('packages/'.length)))
    .flatMap((group) =>
      group === 'packages/apps'
        ? folders(root, group).flatMap((app) => folders(root, app))
        : folders(root, group),
    )
}

export function factsOf(root: string, dir: string): PackageFacts {
  return {
    dir,
    manifest: readJson(root, `${dir}/package.json`),
    hasReadme: existsSync(join(root, dir, 'README.md')),
    hasIndex: existsSync(join(root, dir, 'src/index.ts')),
    hasTests: hasTestFile(root, dir),
    tsconfigLib: tsconfigLib(root, dir),
  }
}
