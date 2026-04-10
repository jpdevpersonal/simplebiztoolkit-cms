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

For local production runs, set `API_URL` for server-side proxy and auth traffic. `NEXT_PUBLIC_API_URL` is only the browser-visible origin. Keeping both set to the same origin removes ambiguity when `npm run start` is proxying admin writes.

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

## API architecture (centralized fetch)

To avoid duplicated request/parsing/error logic, API calls are layered and centralized:

- Shared transport: `src/lib/httpTransport.ts`
	- `sendHttpRequest` (single place that calls `fetch`)
	- `parseHttpResponse` (JSON/text parsing)
	- `unwrapDataEnvelope` / `extractErrorMessage` (common response/error handling)
- Browser/client API wrappers: `src/lib/clientApi.ts`
	- Use this from client components (admin forms, loaders, table refreshes, revalidation calls)
- Server-side API service: `src/lib/api.ts`
	- Use this in server components/pages for backend reads/writes
- Next.js API proxy routes: `src/lib/apiProxy.ts`
	- Proxies authenticated and unauthenticated `/api/*` route-handler traffic to backend
- Auth login call: `src/lib/auth.ts`
	- Uses the same shared transport for backend auth requests

### Rule of thumb for new API calls

1. Put request/response behavior in `httpTransport` only when it is truly generic.
2. Add endpoint-specific methods to `clientApi` (client-side) or `api` (server-side).
3. Call those wrappers from UI/routes; avoid direct `fetch` in components unless there is a strong reason.

## Deployment

This repo is configured to deploy to Azure Static Web Apps via GitHub Actions.

- Workflow: `.github/workflows/azure-static-web-apps-salmon-mushroom-09d02e403.yml`
- The Azure SWA build must receive `API_URL` and `NEXT_PUBLIC_API_URL` so `next build` can generate sitemap and static routes in production.
- After product or CMS page updates, the backend should trigger `POST /api/revalidate` so Next.js refreshes cached public routes and `/sitemap.xml` without waiting for a redeploy.
- Static Web Apps routing/headers: `staticwebapp.config.json`
