# Node.js CI/CD Demo

A small Express API that shows a full CI/CD pipeline with **GitHub Actions**:

```
git push → Lint → Test (Node 18/20/22) → Docker build + smoke test → Deploy to Render
```

## Project structure

```
node-cicd-demo/
├── .github/workflows/ci-cd.yml   # the pipeline
├── src/
│   ├── app.js                    # Express routes
│   ├── calculator.js             # business logic
│   └── server.js                 # starts the server
├── tests/                        # Jest + Supertest tests
├── Dockerfile
├── eslint.config.js
└── package.json
```

## Run locally

```bash
npm install
npm run lint
npm test
npm start          # http://localhost:3000
```

Endpoints: `/`, `/health`, `/api/add?a=2&b=3`, `/api/multiply?a=4&b=5`

## Set up the pipeline

### 1. Push to GitHub
Create an empty repository on GitHub (for example `node-cicd-demo`), then:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/node-cicd-demo.git
git push -u origin main
```

Open the **Actions** tab. The pipeline runs `test → build → deploy`. The deploy step is skipped until step 2 is done.

### 2. Connect deployment (Render, free tier)
1. Sign in at https://render.com with GitHub.
2. **New → Web Service** → pick this repository.
3. Runtime **Docker** (or Node with build `npm ci`, start `npm start`).
4. In the service **Settings**, set **Auto-Deploy = No**, so that only the pipeline deploys.
5. Copy the **Deploy Hook URL** from Settings.
6. In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: the hook URL

Every push to `main` that passes CI now deploys automatically.

### 3. Optional: manual approval (Continuous Delivery)
In GitHub, go to **Settings → Environments → production → Required reviewers** and add yourself. Deploys then wait for your approval.

## Demo script (what to show the audience)

**Demo 1: Happy path**
1. In `src/app.js`, change `VERSION = '1.0.0'` to `'1.1.0'`.
2. Commit and push to `main`.
3. Show the **Actions** tab: lint, tests on 3 Node versions, Docker build, then deploy.
4. Open the live URL: the page now shows version 1.1.0.

**Demo 2: CI blocks a bug**
1. Create a branch: `git checkout -b bug-demo`.
2. Break the logic in `src/calculator.js`: `return a - b;` in `add()`.
3. Push and open a **pull request**.
4. Show the tests failing on the PR (red ❌). Deploy does not run, so production stays safe.
5. Fix the code and push again. The checks turn green ✅ and the PR can be merged, which deploys it.

**Demo 3: Lint catches problems**
Add an unused variable (`const x = 1;`) to any file and push. The **Lint** step fails.

## Pipeline jobs

| Job | Stage | Runs when | What it does |
|---|---|---|---|
| `test` | CI | Every push and PR | `npm ci`, ESLint, Jest on Node 18, 20 and 22 |
| `build` | CI | After `test` passes | Builds the Docker image and checks `/health` |
| `deploy` | CD | Push to `main` only, after `build` | Calls the Render deploy hook |
