# Simple Biz Toolkit

Marketing site built with Next.js (App Router) + React + TypeScript.

## Prerequisites

- Node.js 20+ (matches the GitHub Actions workflow)
- npm 9+

## Run locally (recommended)

Install dependencies:

```bash
npm ci
```

Start the dev server:

```bash
npm run dev
```

Then open:

- http://localhost:3000

## Run locally via Azure Static Web Apps emulator (optional)

If you want to test through the SWA emulator (closer to Azure behavior):

1) Install the SWA CLI:

```bash
npm install -g @azure/static-web-apps-cli
```

2) Start the emulator and proxy it to the Next dev server:

```bash
swa start http://localhost:3000 --run "npm run dev" --port 4281 --verbose
```

Then open:

- http://localhost:4281

Notes:

- The SWA default port is `4280`. If you get “port already taken”, pick a different port (like `4281`).

## Production build (local)

Build:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

## Tests and lint

```bash
npm run lint
npm run test
```

## Deployment

This repo is configured to deploy to Azure Static Web Apps via GitHub Actions.

- Workflow: `.github/workflows/azure-static-web-apps-gentle-rock-046101810.yml`
- Static Web Apps routing/headers: `staticwebapp.config.json`
