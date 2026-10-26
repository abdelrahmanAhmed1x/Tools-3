# Tools Project frontend

A responsive dark-themed React + TypeScript + Tailwind CSS delivery workspace for the existing Go API. Uses Vite and Lucide icons, without a UI framework or extra state library.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. The development server proxies `/api` to the backend at **http://127.0.0.1:8082**. If your backend uses another address, copy `.env.example` to `.env.local` and change `API_PROXY_TARGET`.

## Workspaces

- **Customer:** register, book shipments, search and filter orders, inspect the delivery route and status history, and cancel pending shipments.
- **Admin:** view all shipments, assign or reassign couriers, advance delivery statuses, cancel pending shipments, inspect assignment history, delete shipments with confirmation, and browse the courier directory.
- **Courier:** review assigned deliveries, accept or decline pending assignments, and advance accepted deliveries through pickup, transit, and delivery.

The signed-in account determines the workspace. Registration creates customer accounts, matching the API. Admin and courier accounts come from the backend. For seeded development accounts, see `backend/internal/migrations/20261021180000_seed_demo_accounts.sql` in the parent project.

All shipment data comes from the API; no sample shipments are inserted. Lists support search, status filters, and client-side pagination. The dashboard totals cover the orders returned by the current account’s endpoint. For couriers, that endpoint returns current pending/accepted assignments.

Authentication uses the backend’s HttpOnly `session` cookie. Requests include cookies and do not store or send bearer tokens. On startup, `/auth/me` restores the signed-in profile; a guest response simply shows sign in. Signing out asks the backend to clear the cookie. Expired authenticated requests return the UI to sign in. The backend trusts `http://localhost:5173` and `http://127.0.0.1:5173` in both its cookie transport and credential-enabled CORS settings. Use the same hostname for the frontend and API when connecting directly.

## Checks

```bash
npm test
npm run build
```

The interaction tests use mocked API responses to cover sign in, customer booking and cancellation confirmation, admin assignment and status progression, courier acceptance, and dashboard filtering. They do not mutate the running backend.

## Production

`npm run build` creates `dist/`. Serve it with a reverse proxy forwarding `/api` to the Go API, or set `VITE_API_BASE_URL` at build time for a separate API origin with appropriate CORS settings. `API_PROXY_TARGET` only configures the development server. `npm run preview` previews static assets and requires a separate API reverse proxy or `VITE_API_BASE_URL`.

## Inspection data

See [`../backend/DEMO_DATA.md`](../backend/DEMO_DATA.md) for the demo migration, account credentials, and a feature-by-feature inspection guide.
