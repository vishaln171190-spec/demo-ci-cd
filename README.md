# Node.js CI/CD Demo (Dev → Stage on cPanel)

A small Express API with a full CI/CD pipeline built on **GitHub Actions**. It deploys to two cPanel Node.js apps:

| Environment | URL | How it deploys |
|---|---|---|
| **Dev** | https://demo-dev-cicd.vinap.in | Automatically on every push to `main` that passes the tests |
| **Stage** | https://demo-stage-ci-cd.vinap.in | After dev succeeds **and** a reviewer approves |

```
push to main → Lint & Test (Node 18/20/22) → Package → Deploy DEV → ⏸ Approval → Deploy STAGE
pull request → Lint & Test only (nothing is deployed)
```

The **same package** is deployed to dev and then to stage. The home page shows a coloured badge (DEV or STAGE), the commit and the pipeline run, so you can see exactly which build is live in each environment.

## Project structure

```
.github/workflows/
├── ci-cd.yml           # main pipeline: test → package → dev → stage
└── deploy-cpanel.yml   # reusable deploy job (SSH + restart + health check)
src/                    # Express app
tests/                  # Jest + Supertest tests
```

## Run locally

```bash
npm install
npm run lint
npm test
npm start          # http://localhost:3000
```

---

## One-time setup

### 1. cPanel: create two Node.js apps
In **cPanel → Setup Node.js App → Create Application**, create both apps:

| Field | Dev app | Stage app |
|---|---|---|
| Node.js version | 20 (or the newest available) | same |
| Application mode | Production | Production |
| Application root | `demo-dev-cicd` | `demo-stage-ci-cd` |
| Application URL | `demo-dev-cicd.vinap.in` | `demo-stage-ci-cd.vinap.in` |
| Application startup file | `src/server.js` | `src/server.js` |

> The application roots must match `app_root` in `ci-cd.yml`. If you choose other names, change them there.

Also turn on HTTPS for both subdomains (**cPanel → SSL/TLS Status → Run AutoSSL**), because the health check calls the `https://` URLs.

### 2. cPanel: create an SSH key for GitHub
1. Go to **cPanel → SSH Access → Manage SSH Keys → Generate a New Key**. Name it `github_deploy` and leave the passphrase **empty**.
2. Under **Public Keys**, click **Manage → Authorize** for that key.
3. Under **Private Keys**, click **View/Download** and copy the whole private key, including the `-----BEGIN ... KEY-----` and `-----END ... KEY-----` lines.
4. Note your SSH port (often `22`; some hosts use a custom one such as `21098`).

### 3. GitHub: add secrets
Go to **Repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Example value |
|---|---|
| `SSH_HOST` | `vinap.in` (or `103.108.220.222`) |
| `SSH_PORT` | `22` |
| `SSH_USER` | your cPanel username |
| `SSH_PRIVATE_KEY` | the private key from step 2 |

### 4. GitHub: add the approval gate for stage
1. Go to **Repo → Settings → Environments → New environment** and name it `staging`.
2. Tick **Required reviewers**, add yourself, then click **Save protection rules**.
3. Optionally, create a `development` environment too. It needs no rules, and the pipeline creates it automatically if it doesn't exist.

---

## Demo script

**Demo 1: Dev → Stage promotion**
1. In `src/app.js`, change `VERSION = '1.0.0'` to `'1.1.0'`, then commit and push to `main`.
2. Open the **Actions** tab and show: tests → package → **Dev** deploys automatically.
3. Open https://demo-dev-cicd.vinap.in. It shows **DEV**, version 1.1.0 and the new commit.
4. In Actions, the **Stage** job shows *Waiting for review*. Click **Review deployments → Approve**.
5. Open https://demo-stage-ci-cd.vinap.in. It shows **STAGE** with the **same commit**.

**Demo 2: CI blocks a bug**
1. `git checkout -b bug-demo`
2. In `src/calculator.js`, change `add()` to `return a - b;`, push, and open a pull request.
3. The tests fail on the PR ❌. Nothing deploys, and dev and stage are untouched.
4. Fix the code and push. The checks turn green ✅, and merging the PR starts the dev → stage flow.

**Demo 3: Reject a release**
Push a change. Once it reaches dev, **Reject** the stage deployment. Stage keeps running the previous version.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Permission denied (publickey)` | The key isn't authorized in cPanel, or the wrong private key or user is in the secrets |
| `Connection refused` / timeout on SSH | Wrong `SSH_PORT`, or the host blocks SSH. Ask the host to enable SSH access |
| `ls: .../nodevenv/...: No such file` | The Node.js app wasn't created in cPanel, or `app_root` doesn't match |
| Health check fails | Check the app in **Setup Node.js App** (it must be started), that AutoSSL is issued, and the logs in `~/<app_root>/stderr.log` |
