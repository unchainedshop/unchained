# Forgejo CI on master

The `docker` runner runs `.forgejo/workflows/ci.yml` and
`.forgejo/workflows/admin-ui-e2e.yml` on master/develop pushes and master pull
requests. The CI workflow also runs for tags. Both workflows support manual runs.

The test jobs use Node 26.8.2. Engine tests use MongoDB Memory Server with MongoDB
8.2.12. Build, lint, and test failures block the engine workflow; the v4 Jenkins
convention of ignoring test failures is deliberately not carried over.

The Trivy gate scans fixable HIGH/CRITICAL dependency findings. Its Linux amd64
binary is pinned to 0.74.0 and checksum-verified. The database cache rotates daily.
JavaScript actions run on the Node-capable runner, not inside the Trivy image.

## Docs publishing

After tests and Trivy pass, pushes and manual runs publish the docs image to
`git.ucc.dev/unchained/unchained/docs`. Pull requests never publish.

Configure these repository or organization Actions settings:

| Setting | Purpose |
| --- | --- |
| Secret `PKG_PUSH_TOKEN` | PAT with package-write permission for the `unchained` organization |
| Variable `REGISTRY_USER` | PAT owner's registry username; defaults to `github.actor` |

The runner needs Docker access, Bash, curl, tar, sha256sum, and Node for Actions.
Docs use plain `docker build` / `docker push`, preserving the metadata action's
labels and tags, because the v4 migration encountered Forgejo registry failures
with buildx publishing. Tags are `sha-<short>`, `<branch>-latest`, `next` on develop,
`latest` on master, and `stable` on git tags.

## Admin UI and legacy jobs

`admin-ui-e2e.yml` builds the v5 static export and SDK, runs Cypress, and uploads
failure screenshots. It does not publish a container image.

The v4 Admin UI image-publishing workflow is not a compatible drop-in for master:
the old Dockerfile requires a removed standalone `admin-ui/package-lock.json` and
runs `next start`, while v5 uses a static export. A v5 container build/serve design
must be established before migrating that publishing job. Do not use the v4 job
to publish v5 prereleases under stable major/minor image tags.

Existing Jenkinsfiles are retained. Disabling Jenkins, changing git remotes,
setting up push mirrors, and changing deployed image references are separate
operator actions. This port does not perform them. npm publishing is separate
from these workflows.
