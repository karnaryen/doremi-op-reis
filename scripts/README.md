# scripts

Repository scripts. They run in Node, not in the browser. Node runs the TypeScript files directly ([Node: TypeScript](https://nodejs.org/api/typescript.html)), so there is no build step.

This folder is an Nx project (`project.json`), not a pnpm package: its tools (`vitest`, `@types/node`) are in the root `package.json`.

| File                 | Content                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `structure.ts`       | The structure rules as functions without file system code, so tests can call them. |
| `workspace.ts`       | Reads the facts about the packages from the file system.                           |
| `check-structure.ts` | Joins the two and prints the problems: `pnpm structure:check`.                     |
| `*.test.ts`          | Vitest tests: `pnpm nx run scripts:test`.                                          |

The rules: [docs/tech/monorepo.md](../docs/tech/monorepo.md#structure-check).
