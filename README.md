# Node.js CI/CD Demo (Dev → Stage)

Node.js powers the **CI** part (lint, tests, build). The build produces a **static site**, so it runs on ordinary PHP/cPanel hosting with no Node.js needed on the server.

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

### 1. cPanel: find each subdomain's document root
In **cPanel → Domains** (or **Subdomains**), look at the **Document Root** column for both subdomains. The pipeline expects:

| Subdomain | Expected document root |
|---|---|
| demo-dev-cicd.vinap.in | `/home/<user>/demo-dev-cicd.vinap.in` |
| demo-stage-ci-cd.vinap.in | `/home/<user>/demo-stage-ci-cd.vinap.in` |

If yours is different (for example `public_html/demo-dev-cicd`), change `deploy_path` in `.github/workflows/ci-cd.yml` to that path **relative to your home folder**.

Also make sure both subdomains have HTTPS (**cPanel → SSL/TLS Status → Run AutoSSL**), because the health check calls the `https://` URLs.

### 2. cPanel: create an SSH key for GitHub
1. Go to **cPanel → SSH Access → Manage SSH Keys → Generate a New Key**. Name it `github_deploy` and leave the passphrase **empty**, because GitHub can't type one.
2. Back on the key list, under **Public Keys**, click **Manage → Authorize** for `github_deploy`.
3. Under **Private Keys**, click **View/Download** for `github_deploy` and copy the whole text box.

### 3. GitHub: add the 4 secrets
Go to **Repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | What to put | Example |
|---|---|---|
| `SSH_HOST` | The server IP (recommended) or domain | `103.108.220.222` |
| `SSH_PORT` | The SSH port from cPanel → SSH Access or your hosting email | `22` (some hosts use `21098` or `2222`) |
| `SSH_USER` | Your **cPanel login username** (not an email address) | `myuser` |
| `SSH_PRIVATE_KEY` | The full private key from step 2, including the BEGIN and END lines | `-----BEGIN OPENSSH PRIVATE KEY-----`<br>`...`<br>`-----END OPENSSH PRIVATE KEY-----` |

To test the values from your own computer before running the pipeline, save the key as `key.txt` and run:
```bash
ssh -i key.txt -p 22 <cpanel-user>@103.108.220.222 "pwd && ls"
```
If this lists your home folder, including `demo-dev-cicd.vinap.in`, the secrets will work.

### 4. GitHub: add the approval gate for stage
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
| `Permission denied (publickey)` | The key isn't **Authorized** in cPanel, or `SSH_USER` or the key text is wrong |
| SSH timeout / `Connection refused` | Wrong `SSH_PORT`, or SSH isn't enabled for your account. Ask your host |
| `Document root ... does not exist` | Fix `deploy_path` in `ci-cd.yml` to match cPanel → Domains |
| Health check fails | Check that AutoSSL is issued for the subdomain and that the URL opens in a browser |
