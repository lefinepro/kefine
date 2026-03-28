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

- `bun` 1.2.x
- `docker` and `docker compose` if you want the simplest full-stack run

Optional for local wallet auth:

- A Reown / WalletConnect project ID

## Quick start

If you just want to bring the full app up quickly, use Docker:

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

This is the easiest way to run the frontend together with the local `crater` service.

The frontend production container is built from the repo root [Containerfile](/home/kg/datastore/dev/lefine/kefine/Containerfile) and serves requests through Caddy on port `5173` by default.

## Local development setup

### 1. Install dependencies

```bash
bun install
```

### 2. Create an environment file

Create a `.env` file in the project root.

Example:

```env
KEFINE_CRATER=http://localhost:3001
KEFINE_EXCHANGE=http://localhost:3001
VITE_REOWN_PROJECT_ID=your_reown_project_id
```

Notes:

- `KEFINE_CRATER` is the crater base URL used by the SvelteKit proxy for all order, payment, and passkey operations.
- `KEFINE_EXCHANGE` is the exchange base URL crater uses for user IDs and payment links.
- `VITE_REOWN_PROJECT_ID` is needed if you want wallet login/connect flows to work correctly.
- `KEFINE_DATABASE_URL` is the Postgres connection string crater uses for orders, payment redemptions, passkey users, challenges, sessions, and outbox activity persistence. In production you should point this to the same database used by the exchange.

### Remote exchange mode

To test against the hosted Lefine exchange instead of the local `crater`, use:

```env
KEFINE_CRATER=http://localhost:3001
KEFINE_EXCHANGE=https://lefine.pro/exchange
```

With this setup:

- the frontend sends task, payment, and passkey requests only to the app's own crater-facing routes,
- the SvelteKit server forwards those requests to crater,
- crater persists orders, outbox activity, users, passkeys, challenges, sessions, and payment redemptions in Postgres, while still using `KEFINE_EXCHANGE` for exchange-facing URLs,
- the UI keeps polling status updates through crater instead of talking to the exchange directly.

### 3. Start the backend

You have two practical options.

Option A: run only the backend in Docker

```bash
docker compose up --build crater
```

Option B: run the backend directly with Crystal

```bash
cd crater
shards install
crystal run src/crater.cr
```

The backend listens on `http://localhost:3001` by default.

### 4. Start the frontend

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

- Requires `VITE_REOWN_PROJECT_ID`
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

- The frontend assumes crater is reachable on port `3001` unless `KEFINE_CRATER` overrides it.
- Exchange-facing IDs and payment links are derived from `KEFINE_EXCHANGE`.
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
docker run --rm -p 5173:5173 \
  -e KEFINE_CRATER=http://host.docker.internal:3001 \
  -e KEFINE_EXCHANGE=http://host.docker.internal:3001 \
  kefine-frontend
```

## Troubleshooting

### The app opens, but task creation does not work

Check that:

- `crater` is running on `localhost:3001`
- `KEFINE_CRATER` points to the correct crater URL
- your browser can access both the frontend and backend ports

### Wallet connect does not work

Check that:

- `VITE_REOWN_PROJECT_ID` is set
- you restarted the dev server after changing `.env`

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
