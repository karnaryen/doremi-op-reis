# CLAUDE.md

## Commits and pull requests

- I am the only author of every commit. Do not add Claude as author or co-author.
- Do not add Claude attribution to commit messages or PR descriptions: no `Co-Authored-By: Claude` line, no "Generated with Claude Code" line.
- Never commit secrets, tokens or sensitive data: passwords, API keys, R2 access keys, database URLs with credentials, `APP_SECRET`, JWT keys, personal data. Keep them in local env files that git ignores (`.env.local`) or in the hosting settings. Commit only example files with empty values (`.env.example`).
- `.env` is committed, so it has only example or default values, never real secrets. Real values go to `.env.local`.
- Before each commit, check the staged diff for secrets. If a secret was committed, tell me at once: it must be rotated, not only deleted.

## Project documentation

Product and technical docs: [docs/README.md](docs/README.md). Read the related file before you work on a feature.

The repository is an Nx monorepo. Follow the folder, tag and route rules in [docs/tech/monorepo.md](docs/tech/monorepo.md).

The app is mobile-first. Follow [docs/product/mobile-design.md](docs/product/mobile-design.md) for all UI work.

## Checking facts

- Before you make or suggest a decision (a service, library, plan, limit, price, API behavior), check the facts in the official documentation of that technology or service. Do not rely on memory.
- When you write such facts into the docs, add a link to the official source.
- If the official documentation does not say something (for example, whether a free plan has an end date), say so. Do not guess.

## Learning the backend stack

I am learning PHP, Symfony, PostgreSQL and Cloudflare R2 on this project. Follow this guide in every session:

@docs/learning-guide.md
