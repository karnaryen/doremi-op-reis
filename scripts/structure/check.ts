/**
 * Checks the structure rules of the monorepo: `pnpm structure:check`.
 * The rules are in `rules.ts`, the file reading is in `workspace.ts`.
 * Node runs TypeScript files directly: https://nodejs.org/api/typescript.html
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkLockfile, checkPackage, checkRootManifest } from './rules.ts'
import { factsOf, packageDirs, readJson } from './workspace.ts'

const root = join(import.meta.dirname, '../..')
const lockfile = join(root, 'pnpm-lock.yaml')

const problems: string[] = []
const report = (where: string, found: string[]) =>
  problems.push(...found.map((problem) => `${where}: ${problem}`))

const dirs = packageDirs(root)
for (const dir of dirs) report(dir, checkPackage(factsOf(root, dir)))
report('package.json', checkRootManifest(readJson(root, 'package.json')))
report(
  'pnpm-lock.yaml',
  existsSync(lockfile)
    ? checkLockfile(readFileSync(lockfile, 'utf8'))
    : ['the file is missing: run pnpm install'],
)

if (problems.length > 0) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} structure problem(s). Rules: docs/tech/monorepo.md`)
  process.exit(1)
}
console.log(`Structure is correct: ${dirs.length} packages.`)
