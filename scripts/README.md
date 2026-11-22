# scripts

Repository scripts. They run in Node, not in the browser. Node runs the TypeScript files directly ([Node: TypeScript](https://nodejs.org/api/typescript.html)), so there is no build step.

This folder is an Nx project (`project.json`), not a pnpm package: its tools (`vitest`, `@types/node`) are in the root `package.json`.

One folder for each task. Files in the root of `scripts/` are only the settings of the Nx project (`project.json`, `tsconfig.json`).

## `structure/`: the structure check

`pnpm structure:check`

| File           | Content                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `check.ts`     | The command: joins the two files below and prints the problems.                    |
| `rules.ts`     | The structure rules as functions without file system code, so tests can call them. |
| `workspace.ts` | Reads the facts about the packages from the file system.                           |
| `*.test.ts`    | Vitest tests: `pnpm nx run scripts:test`.                                          |

The rules: [docs/tech/monorepo.md](../docs/tech/monorepo.md#structure-check).

## A new script

Put it in a folder with the name of its task, for example `scripts/release/`. Give the command file a script in the root `package.json`. `typecheck`, `lint` and `test` of the `scripts` project find the new folder without a change.
