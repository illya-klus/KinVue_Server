## What to do

Add strict shared TypeScript and Prettier configuration at the monorepo root (`tsconfig.base.json`, `.prettierrc`). All services and packages inherit these settings for consistent type-checking and formatting.

## Technical notes

- Files: `tsconfig.base.json`, `.prettierrc` at repo root
- Labels: infra

## Story points

1

## Depends on

KIN-3

## Acceptance criteria

- `tsconfig.base.json` with strict TypeScript settings
- `.prettierrc` configured
- `pnpm typecheck` passes

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
