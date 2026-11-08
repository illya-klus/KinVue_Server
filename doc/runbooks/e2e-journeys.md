# E2E journeys (Phase 29, KIN-133)

| Step      | Spec (KinVue_Client)                              | Needs stack                 |
| --------- | ------------------------------------------------- | --------------------------- |
| 29.1–29.5 | `e2e/journeys.spec.ts`                            | `E2E_STACK=1`               |
| 29.19     | `e2e/notifications-friend-room.spec.ts` (KIN-125) | `E2E_STACK=1` + credentials |
| Smoke     | `e2e/home.spec.ts`                                | build only                  |

Run all:

```bash
cd KinVue_Server && pnpm test:e2e
```

Full stack locally:

```bash
cd KinVue_Client && pnpm test:e2e:full
```

CI: `.github/workflows/playwright.yml` (KIN-245) uploads artifacts on failure.

Branch protection requiring green CI is an operator setting on GitHub (Step 28.13).
