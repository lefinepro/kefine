# Lefine

Kefine is a SvelteKit application for submitting solver tasks, tracking their execution state, and moving through authentication and payment flows. This repository also includes a small backend service called `crater` that accepts orders and serves order status updates.

## Tech stack

- Frontend: SvelteKit + Vite + TypeScript
- Package manager: Bun
- End-to-end tests: Playwright
- Local backend: Crystal (`crater`)

## What you can do in the app

- Create a new task from the main screen
- Open a task detail page at `/task/:id`
- Track queued, active, payment-ready, and completed states
- Authenticate with a wallet or passkey
- Try the anonymous payment/deposit flow
- Reopen existing tasks from the shared order list

## Prerequisites

Install the following tools before starting:

- `mise`
- `nerdctl` with `nerdctl compose`

Optional for local wallet auth:

- A Reown / WalletConnect project ID

## Quick start

If you just want to bring the full app up quickly, use `nerdctl compose`:

```bash
nerdctl compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

This is the easiest way to run the frontend together with the local `crater` service.

The frontend production container is built from the repo root [Containerfile](/home/kg/datastore/dev/lefine/kefine/Containerfile) and serves requests through Caddy on port `5173` by default.

## Local development setup

### 1. Install toolchain and dependencies

Trust the repository once so `mise` can execute project tasks:

```bash
mise trust
```

Then install the pinned toolchain:

```bash
mise install
```

This installs the pinned local versions of Bun, Node.js, and Crystal from [`mise.toml`](/home/kg/datastore/dev/lefine/kefine/mise.toml).

Then install project dependencies:

```bash
mise run install
```

### 2. Configure `kefine.config.json`

All runtime configuration now lives in the repo-root [`kefine.config.json`](/home/kg/datastore/dev/lefine/kefine/kefine.config.json).

Main sections:

```json
{
  "app": {
    "reownProjectId": "your_reown_project_id"
  },
  "origins": {
    "primary": "https://lefine.pro",
    "legal": "https://legal.lefine.pro",
    "task": "https://tasks.lefine.pro"
  },
  "backend": {
    "craterBaseUrl": "http://localhost:3001",
    "exchangeBaseUrl": "https://lefine.pro/exchange",
    "databaseUrl": "postgresql://kefine:kefine@localhost:5432/kefine"
  },
  "company": {
    "legalName": "Lefine",
    "email": "order@lefine.pro"
  }
}
```

Notes:

- `app.reownProjectId` is needed if you want wallet login/connect flows to work correctly.
- `backend.craterBaseUrl` is the crater base URL used by the SvelteKit proxy for order, payment, and passkey operations.
- `backend.exchangeBaseUrl` is the exchange base URL crater uses for user IDs and payment links.
- `backend.databaseUrl` is the Postgres connection string crater uses for orders, payment redemptions, passkey users, challenges, sessions, and outbox activity persistence.
- `company.*` controls the new `/legal-information` company page. Empty optional fields are hidden automatically.

### 2a. Repository defaults: `.lepos.rcl`

When a task repository is created, crater now seeds it with `.lepos.rcl` in the repository root.
You can use this config to control repository storage behavior:

```rcl
[repository]
icon = "🧩"
issue_storage = "filesystem"   # or "database"
default_branch = "main"
accept_pull_issues = true
accept_pull_patches = true
issue_root = ".meta/issues"
issue_readme_name = "README.org"
issue_file_name = "issue.org"
issue_attachments_dir = "attachments"
main_readme_path = ".meta/lefine.pro.org"
repository_readme = "Lefine repository metadata and task context"
reps_config_paths = "reps.rcl,reps.toml"
agent_system_prompt_path = ""
```

- `issue_storage = "filesystem"` writes per-order notes and attachments to `issue_root`.
- `issue_storage = "database"` stores issue metadata/attachments in Postgres (`repository_issue_artifacts`) instead of repository files.
- `icon` stores repository icon metadata.
- `default_branch` controls branch name exposed to clients as `repository.defaultBranch` when repository metadata is fetched.
- `accept_pull_issues` and `accept_pull_patches` control which push branches create auto-run exchange issues.
- `main_readme_path` configures the repository-level readme path.
- `issue_root`, `issue_file_name`, `issue_readme_name`, and `issue_attachments_dir` control issue artifact layout.
- `reps_config_paths` lists repo-level config files to read (`reps.rcl`/`reps.toml` by default).
- `agent_system_prompt_path` sets a repository-level path for system prompt configuration.

Example `reps.rcl` file:

```rcl
[reps]
repositories = ["repo-a", "repo-b"]
repository_config_path = "reps"
agent_system_prompt_path = "agents/system_prompt.md"
```

If `reps.rcl` is missing, `reps.toml` is checked next.

If `.lepos.rcl` is absent, crater uses default values and writes a new default `.lepos.rcl` on first seed.
Both `/status/:id` and `/projects/:id/repository` now expose repository `.lepos.rcl` settings under `repository.leposConfig`, so clients can inspect `issueStorage` and path settings for repositories they receive.

### Git hooks and CI

Project CI now runs through `githooks` scripts and all checks are executed in containers.

- `/.githooks/ci` contains the current CI entrypoint
- `/.githooks/pre-commit` runs lint only
- `/.githooks/pre-push` runs the full CI pipeline

Run full checks locally with:

```bash
./.githooks/ci
```

To make Git trigger hooks automatically:

```bash
git config core.hooksPath .githooks
```

### Remote exchange mode

To test against the hosted Lefine exchange instead of the local `crater`, use:

```json
{
  "backend": {
    "craterBaseUrl": "http://localhost:3001",
    "exchangeBaseUrl": "https://lefine.pro/exchange"
  }
}
```

With this setup:

- the frontend sends task, payment, and passkey requests only to the app's own crater-facing routes,
- the SvelteKit server forwards those requests to crater,
- crater persists orders, outbox activity, users, passkeys, challenges, sessions, and payment redemptions in Postgres, while still using `backend.exchangeBaseUrl` for exchange-facing URLs,
- the UI keeps polling status updates through crater instead of talking to the exchange directly.

### External crater / global URLs

If `crater` is exposed on a public URL, do not leave the container defaults on `localhost`.

Use separate values for:

- `backend.craterBaseUrl`: the public base URL crater uses when generating `orderId`, actor IDs, inbox/outbox URLs, and related links
- `backend.exchangeBaseUrl`: the public exchange/app base URL crater uses for `/pay/*`, user IDs, and exchange-facing links
- `origins.primary`: the public frontend origin

Example when crater is hosted directly on `https://lefine.pro` and exchange is hosted on `https://lefine.pro/exchange`:

```json
{
  "backend": {
    "craterBaseUrl": "https://lefine.pro",
    "exchangeBaseUrl": "https://lefine.pro/exchange"
  },
  "origins": {
    "primary": "https://lefine.pro",
    "legal": "https://lefine.pro",
    "task": "https://lefine.pro"
  }
}
```

### Split pages by domain

The frontend can redirect different page groups onto different public origins without changing route paths.

- `origins.primary`: primary site origin, used for `/`
- `origins.legal`: legal pages origin for `/privacy`, `/terms`, `/legal-information`
- `origins.task`: task flow origin for `/create`, `/task/*`, `/order/*`, `/payment/*`, `/pay/*`, `/status*`, `/passkeys/*`, `/api/kefine/*`

Example:

```json
{
  "origins": {
    "primary": "https://lefine.pro",
    "legal": "https://legal.lefine.pro",
    "task": "https://tasks.lefine.pro"
  }
}
```

With that setup:

- `https://lefine.pro/privacy` redirects to `https://legal.lefine.pro/privacy`
- `https://lefine.pro/task/<id>` redirects to `https://tasks.lefine.pro/task/<id>`
- local development on `localhost` is not redirected

For this setup:

- new `orderId` values are emitted under the configured public crater/exchange URLs instead of local defaults
- payment and exchange-facing links are emitted under the configured exchange URL
- the frontend proxies requests to the hosted crater at `https://lefine.pro`

### 3. Start the full local stack

The recommended local workflow is now a single `mise` command:

```bash
mise run dev
```

This command:

- ensures frontend dependencies are installed,
- starts Postgres via `nerdctl compose`,
- waits until the database is ready,
- starts `crater` in a container on `http://localhost:3001`,
- starts the SvelteKit frontend on `http://localhost:5173`.

You can also run just `mise run`, because the default task maps to `dev`.

### 4. Useful `mise` tasks

- `mise run frontend` runs only the frontend
- `mise run backend` runs the backend in a container and ensures Postgres is up
- `mise run backend:local` runs the backend directly with local Crystal
- `mise run backend:down` stops the backend container
- `mise run db:up` starts only Postgres
- `mise run db:down` stops only Postgres
- `mise run install` refreshes all project dependencies

### FRP tunnel for `dev-proxy.col.pub`

`frps` is intended to run on the public server and `frpc` on your local machine.

Server target:

- host: `193.32.177.159`
- control port: `7000`
- internal FRP HTTP vhost port: `8080`
- public HTTPS entrypoint: `443`

Client config template lives at [`scripts/frpc.dev-proxy.toml`](/home/kg/datastore/dev/lefine/kefine/scripts/frpc.dev-proxy.toml).

The tunnel is configured so both the frontend and `crater` live behind the same public origin:

- frontend traffic goes to local `127.0.0.1:5173`
- `crater` paths on the same domain go to local `127.0.0.1:3001`
- app runtime config in [`kefine.config.json`](/home/kg/datastore/dev/lefine/kefine/kefine.config.json) points both `origins.*` and `backend.*BaseUrl` to `https://dev-proxy.col.pub`
- TLS is terminated on the public server by Caddy running under `nerdctl compose`, which proxies to local FRP HTTP routing on port `8080`

Run it like this after starting the frontend locally:

```bash
export FRP_TOKEN='your_server_token'
mise run tunnel
```

Or run the local stack and the tunnel together:

```bash
export FRP_TOKEN='your_server_token'
mise run dev:proxy
```

Important:

- `dev-proxy.col.pub` must have an `A` record pointing to `193.32.177.159`
- until DNS is added, the tunnel will connect but the domain itself will not resolve publicly

### 5. Manual backend options

If you do not want to use the one-command `mise` flow, you still have two practical backend options.

Option A: run only the backend in a container

```bash
nerdctl compose up --build crater
```

Option B: run the backend directly with Crystal

```bash
cd crater
shards install
crystal run src/crater.cr
```

The backend listens on `http://localhost:3001` by default.

### 6. Start the frontend manually

From the repository root:

```bash
bun run dev
```

Open the app at:

```text
http://localhost:5173
```

## How to use the application

### Create and open a task

1. Open `http://localhost:5173`.
2. Enter a task description in the main input, for example:
   - `Deploy my production app`
   - `Need access to Telegram`
   - `Optimize an algorithm`
3. Submit the task.

What happens next:

- The app creates an order through `crater`
- You are redirected to `/task/:id`
- The task detail screen shows solver, ETA, price, and current status

### Reopen an existing task

- Go back to the main page
- Use the left/shared order list
- Click an existing order to reopen its task page

The app also keeps task routes stable, so reloading `/task/:id` should return you to the same task.

### Try authentication flows

The task detail flow supports several auth paths before payment:

- Wallet
- Passkey
- Anonymous

#### Wallet

- Requires `app.reownProjectId` in `kefine.config.json`
- Lets you connect a wallet via Reown/AppKit
- Best option if you want to exercise the wallet-based payment path

#### Passkey

- Uses crater-backed routes under `/passkeys/*`
- Crater stores passkeys, sessions, and exchange user accounts in `.data/exchange-state.json` by default
- Useful for testing passwordless authentication locally

Important:

- Passkeys depend on browser WebAuthn support
- Browser/device behavior may differ between localhost, custom domains, and HTTPS setups

#### Anonymous

- Lets you continue without linking an account first
- Exposes the deposit/payment flow in the UI

### Payment flow

Once a task reaches the payment-ready stage, the UI lets you continue through one of the supported payment paths.

In local development, the most useful thing to verify is that:

- the payment screen opens,
- the deposit dialog can be opened,
- the UI progresses to the result-ready state.

### Result flow

After the payment/deposit step, the UI can reveal a result panel and a save action. This is the final stage of the main task journey.

## Running tests

### Type and Svelte checks

```bash
bun run check
```

### Lint

```bash
bun run lint
```

### Unit tests

```bash
bun run test
```

### End-to-end tests

```bash
bun run test:e2e
```

## Useful development notes

- The frontend assumes crater is reachable on port `3001` unless `backend.craterBaseUrl` overrides it.
- Exchange-facing IDs and payment links are derived from `backend.exchangeBaseUrl`.
- Passkey and exchange account data are stored by crater in `.data/exchange-state.json`; deleting that file resets local state.
- The backend default configuration is development-friendly and should work locally without additional setup.

## Production preview build

To create a production build:

```bash
bun run build
```

To preview it locally:

```bash
bun run preview
```

## Container build

To build the frontend production image directly:

```bash
docker build -f Containerfile -t kefine-frontend .
```

To run it on the default Caddy port:

```bash
docker run --rm -p 5173:5173 kefine-frontend
```

## Troubleshooting

### The app opens, but task creation does not work

Check that:

- `crater` is running on `localhost:3001`
- `backend.craterBaseUrl` in `kefine.config.json` points to the correct crater URL
- your browser can access both the frontend and backend ports

### Wallet connect does not work

Check that:

- `app.reownProjectId` is set
- you updated `app.reownProjectId` in `kefine.config.json`
- you restarted the dev server after changing the config file

### Passkey registration or login fails

Check that:

- your browser supports WebAuthn/passkeys
- you are testing on a valid local origin
- `.data/exchange-state.json` is writable by crater

## Repository structure

```text
.
├── src/                 # SvelteKit frontend
├── crater/              # Crystal backend service
├── e2e/                 # Playwright tests
├── packages/            # Shared local packages
├── Dockerfile           # Frontend container
└── docker-compose.yml   # Full local stack
```
