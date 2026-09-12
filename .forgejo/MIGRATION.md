# Migrating unchained CI from Jenkins to Forgejo Actions

> This is the **CI migration** guide (Jenkins → Forgejo Actions). For the
> product/major-version upgrade guide see the repo-root `MIGRATION.md`.

This repo's CI moves off Jenkins (`jenkins.ucc.dev`) onto **Forgejo Actions** at
`git.ucc.dev`. Two Jenkins pipelines become two workflows:

- **`.forgejo/workflows/ci.yml`** — the mongo-backed lint/test suite + the `docs`
  image (replaces the root `Jenkinsfile`).
- **`.forgejo/workflows/admin-ui.yml`** — the `admin-ui` image with its semver tags
  (replaces `admin-ui/Jenkinsfile`).

Both publish to the **git.ucc.dev package registry** (replacing `registry.ucc.dev`)
and add a **Trivy** vulnerability gate.

| | Old (Jenkins) | New (Forgejo Actions) |
|---|---|---|
| Runs on | `jenkins.ucc.dev` | `git.ucc.dev` runner (`runs-on: docker`) |
| docs image | `registry.ucc.dev/unchained/docs` | `git.ucc.dev/unchained/unchained/docs` |
| adminui image | `registry.ucc.dev/unchained/adminui` | `git.ucc.dev/unchained/unchained/adminui` |
| Lint / tests | ci image: `npm run lint` (gate) + `npm run test \|\| :` (non-blocking) | same, faithfully ported |
| Vuln scan | none | Trivy `fs` gate (fixable HIGH/CRITICAL) |

Tagging is preserved: docs → `<branch>-latest`, `next`@develop, `latest`@master,
`stable`@tag; adminui → `<branch>-latest`, `next`@develop, and **semver**
(`vMAJOR`/`vMAJOR.MINOR`/`vMAJOR.MINOR.PATCH`) on `master`/`v?.x`/`v?.*.x`, `v<version>`
@tag. The adminui **major tags are consumed in prod** (`adminui:1`,`:v2`,`:v3`) —
they must keep publishing.

> **The `@unchainedshop/*` npm packages are out of scope** — they aren't built by
> Jenkins and aren't built here.

---

## Phase 1 — Move to Forgejo Actions

### 1. Forgejo repo

This repo **already exists** on `git.ucc.dev` (`unchained/unchained`) — the current
`ucc` remote points at it. No creation needed.

### 2. Repoint git (origin switch)

Make `git.ucc.dev` the primary `origin`; keep GitHub as `github`:

```bash
git remote rename origin github
git remote rename ucc origin
git push origin --all
git push origin --tags
```

Confirm the Forgejo default branch matches your working branch (e.g. `v4.8.x`).

### 3. Enable Actions

Repo **Settings → Actions → General → enable**. The org-wide runner (`scorpion-4`,
label `docker`) picks the jobs up automatically.

### 4. Add the Actions secrets

**Settings → Actions → Secrets and variables**:

| Kind | Name | Value |
|---|---|---|
| Secret | `REGISTRY_TOKEN` | a **`write:package`** PAT for the `unchained` org (the automatic Actions token cannot push packages). |
| Secret | `TESTS_DOTENV` | the dotenv used by the integration tests (was the Jenkins `unchained-dotenv` credential; written to `./env` before the CI image build). |

(Optional) set variable `REGISTRY_USER` to override the login user.

### 5. Verify

- Open a PR → **`test`** (lint gates; tests non-blocking) and **`trivy`** run.
- Push `develop`/`master`/a version branch → **`docs`** publishes; a change under
  `admin-ui/**` also triggers **admin-ui**. Confirm images under the repo's
  **Packages** tab: `git.ucc.dev/unchained/unchained/{docs,adminui}` with the
  expected tags (incl. adminui `vMAJOR`).

### 6. Cut the registry over

In the **infrastructure** repo, repoint the prod consumers and redeploy:

- `stacks/shared-prod/unchained/unchained.yml` — `registry.ucc.dev/unchained/docs:stable`
  → `git.ucc.dev/unchained/unchained/docs:stable`; `registry.ucc.dev/unchained/adminui:{1,v2,v3}`
  → `git.ucc.dev/unchained/unchained/adminui:{1,v2,v3}`. Then
  `docker stack deploy … --with-registry-auth`.
- Ensure the Swarm managers can pull from `git.ucc.dev` (`docker login git.ucc.dev`).

  (The `…/website/*` images in that same stack file belong to the **unchained-website**
  repo and are repointed by that repo's migration.)

### 7. Decommission Jenkins

Once green and the stack pulls from `git.ucc.dev`, disable/delete the `unchained` and
`unchained-adminui` jobs in Jenkins. Keep them until then as rollback.

---

## Phase 2 — Push-mirror Forgejo → GitHub

Keep the public GitHub repo as a **read-only downstream mirror**.

On `git.ucc.dev`: **Settings → Repository → Mirror Settings → Push Mirror**:

- **Git Remote Repository URL**: `https://github.com/unchainedshop/unchained.git`
- **Authorization**: a GitHub PAT (repo scope).
- Enable **"Sync when commits are pushed"** (and/or an interval).

`git.ucc.dev` becomes the source of truth; every push fans out to GitHub. The GitHub
`.github/workflows/claude.yml` (Claude PR assistant) still runs on GitHub for any
comment-triggered runs there; it is untouched.

**Caveats**

- One-way mirror — do **not** merge PRs on GitHub (they'd be overwritten).
- Only git refs mirror (not packages/LFS).
- The GitHub PAT lives in Forgejo's mirror settings, not as an Actions secret.

---

## Notes / out of scope

- `@unchainedshop/*` npm package publishing (not a Jenkins pipeline).
- `.deepsource.toml` (SaaS static analysis) is unchanged.
- Tests remain **non-blocking** (`|| :`), exactly as Jenkins ran them; lint is the
  hard gate. Tighten by dropping `|| :` once the suite is reliably green.
- BuildKit: Jenkins forced `DOCKER_BUILDKIT=0`; the new pipeline uses buildx for the
  docs/adminui images. If one fails under buildx, fall back to a plain `docker build`/
  `docker push` step (the runner has host docker.sock).
