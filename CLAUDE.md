# CLAUDE.md

## Commits and pull requests

- I am the only author of every commit. Do not add Claude as author or co-author.
- Do not add Claude attribution to commit messages or PR descriptions: no `Co-Authored-By: Claude` line, no "Generated with Claude Code" line.
- Never commit secrets, tokens or sensitive data: passwords, API keys, AWS keys, database URLs with credentials, `APP_SECRET`, JWT keys, personal data. Keep them in local env files that git ignores (`.env.local`) or in the hosting settings. Commit only example files with empty values (`.env.example`).
- `.env` is committed, so it has only example or default values, never real secrets. Real values go to `.env.local`.
- Before each commit, check the staged diff for secrets. If a secret was committed, tell me at once: it must be rotated, not only deleted.

## Project documentation

Product and technical docs: [docs/README.md](docs/README.md). Read the related file before you work on a feature.

The app is mobile-first. Follow [docs/product/mobile-design.md](docs/product/mobile-design.md) for all UI work.

## Learning the backend stack

I am learning PHP, Symfony, PostgreSQL and AWS on this project. Follow this guide in every session:

@docs/learning-guide.md
