## What to do

Set up the pnpm + Turbo monorepo skeleton at the repo root with workspace scripts `dev`, `build`, `test`, `lint`, and `typecheck`. Every KinVue app and package will live inside this workspace, so getting the structure right now prevents rework later.

## Technical notes

- Root scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `infra:up`
- Files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- Labels: infra

## Story points

2

## Depends on

KIN-2

## Acceptance criteria

- `pnpm install` succeeds
- `pnpm build` runs (even if apps are empty stubs)
- Workspace includes `apps/*`, `packages/*`, `tests/*`
- Root scripts: dev, build, test, lint, typecheck

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
