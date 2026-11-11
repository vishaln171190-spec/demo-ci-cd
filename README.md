# Node.js CI/CD Demo (Dev → Stage)

Node.js powers the **CI** part (lint, tests, build). The build produces a **static site**, so it runs on ordinary PHP hosting (mPanel, cPanel, etc.) with no Node.js needed on the server.

| Environment | URL | How it deploys |
|---|---|---|
| **Dev** | https://demo-dev-cicd.vinap.in | Automatically on every push to `main` that passes CI |
| **Stage** | https://demo-stage-ci-cd.vinap.in | After dev succeeds **and** a reviewer approves |

```
push to main → Lint & Test & Build (Node 18/20/22) → Build release → Deploy DEV → ⏸ Approval → Deploy STAGE
pull request → Lint & Test & Build only (nothing is deployed)
```

The **same build** goes to dev and then to stage. The page shows a coloured badge (DEV or STAGE), the commit and the pipeline run, so you can see which build is live in each environment.

## Project structure

```
.github/workflows/
├── ci-cd.yml        # main pipeline: test → build → dev → stage
└── deploy-ssh.yml   # reusable deploy job (upload over SSH + health check)
public/              # HTML, CSS, browser JS, .htaccess
src/calculator.js    # shared logic (tested by Jest, used by the page)
scripts/build.js     # builds dist/ and writes build-info.json
scripts/serve.js     # local preview server
tests/               # Jest tests
```

## Run locally

```bash
npm install
npm run lint
npm test
npm start          # builds and serves dist/ at http://localhost:3000
```

---

## One-time setup

### 1. Create a deploy SSH key (on your computer)
mPanel only stores **public** keys, so create the key pair locally. Use a dedicated key for GitHub, not your personal one:

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions-demo-ci-cd" -f ~/.ssh/github_deploy_demo
```

This creates two files:
- `~/.ssh/github_deploy_demo.pub`: the **public** key, which goes into mPanel.
- `~/.ssh/github_deploy_demo`: the **private** key, which goes into GitHub. Never share it or commit it.

The key needs no passphrase because GitHub Actions can't type one.

### 2. mPanel: add the public key
Go to **mPanel → Developer Tools → SSH Keys → Add SSH key**. Name it `github-actions` and paste the full contents of `github_deploy_demo.pub` (one line starting with `ssh-ed25519`).

### 3. Find each subdomain's document root
In mPanel's domain or subdomain settings, check the **document root** folder of both subdomains. The pipeline expects:

| Subdomain | Expected document root |
|---|---|
| demo-dev-cicd.vinap.in | `~/demo-dev-cicd.vinap.in` |
| demo-stage-ci-cd.vinap.in | `~/demo-stage-ci-cd.vinap.in` |

If yours is different (for example `public_html/demo-dev-cicd`), change `deploy_path` in `.github/workflows/ci-cd.yml` to that path **relative to your home folder**. The test command in step 4 shows which folders exist.

Also make sure both subdomains have an SSL certificate, because the health check calls the `https://` URLs.

### 4. Test the connection from your computer
```bash
ssh -i ~/.ssh/github_deploy_demo -p <port> <ssh-user>@103.108.220.222 "pwd && ls -la"
```
If this logs in **without asking for a password** and lists your home folder, the key works. Use the same port and user in the secrets below.

### 5. GitHub: add the 4 secrets
Go to **Repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | What to put | Example |
|---|---|---|
| `SSH_HOST` | The server IP (recommended) or domain | `103.108.220.222` |
| `SSH_PORT` | The SSH port shown in mPanel → **SSH Auth**, or in your hosting email | `22` |
| `SSH_USER` | Your SSH username (shown in mPanel → **SSH Auth**) | `myuser` |
| `SSH_PRIVATE_KEY` | The full contents of `~/.ssh/github_deploy_demo`, including the BEGIN and END lines | `-----BEGIN OPENSSH PRIVATE KEY-----`<br>`...`<br>`-----END OPENSSH PRIVATE KEY-----` |

> mPanel also offers SSH **password** login, but use the key. Passwords are easier to leak, and the pipeline is built for key login.

### 6. GitHub: add the approval gate for stage
1. Go to **Repo → Settings → Environments → New environment** and name it `staging`.
2. Tick **Required reviewers**, add yourself, then click **Save protection rules**.

---

## Demo script

**Demo 1: Dev → Stage promotion**
1. In `package.json`, change `"version": "1.0.0"` to `"1.1.0"`, then commit and push to `main`.
2. Open the **Actions** tab and show: tests → build → **Dev** deploys automatically.
3. Open https://demo-dev-cicd.vinap.in. It shows **DEV**, version 1.1.0 and the new commit.
4. The **Stage** job shows *Waiting for review*. Click **Review deployments → Approve**.
5. Open https://demo-stage-ci-cd.vinap.in. It shows **STAGE** with the **same commit and build time**.

**Demo 2: CI blocks a bug**
1. `git checkout -b bug-demo`
2. In `src/calculator.js`, change `add()` to `return a - b;`, push, and open a pull request.
3. The tests fail on the PR ❌. Nothing deploys.
4. Fix the code and push. The checks turn green ✅, and merging starts the dev → stage flow.

**Demo 3: Reject a release**
Push a change. Once it reaches dev, **Reject** the stage deployment. Stage keeps the previous version.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Permission denied (publickey)` | The public key isn't added in mPanel → SSH Keys, or `SSH_USER` or the private key text is wrong |
| SSH timeout / `Connection refused` | Wrong `SSH_PORT`, or SSH isn't enabled for your account. Ask your host |
| `Document root ... does not exist` | Fix `deploy_path` in `ci-cd.yml` to match the subdomain's document root in mPanel |
| Health check fails | Check that AutoSSL is issued for the subdomain and that the URL opens in a browser |
