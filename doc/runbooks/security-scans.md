# Security scans

CI runs two security checks on pull requests and pushes to `main` and `dev`:

- Gitleaks scans repository history with its container image pinned to version `8.30.1` and an image digest.
- `pnpm audit --audit-level high` fails on high or critical dependency advisories.

The root `.gitleaks.toml` extends Gitleaks' default rules. It excludes `.env.example`, which contains documented local placeholders rather than deployable credentials, and an example token in the upstream NestJS starter README files. CI smoke-checks the env example exception and verifies that a synthetic high-entropy `api_key` is detected. Keep real credentials out of source and rotate any credential reported by the scan.

To run the dependency check locally, use `pnpm audit --audit-level high`. To scan the working tree with the pinned scanner image, run:

```sh
docker run --rm -v "$PWD:/repo:ro" ghcr.io/gitleaks/gitleaks:v8.30.1 dir --config /repo/.gitleaks.toml --redact /repo
```
