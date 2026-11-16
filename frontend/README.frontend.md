# Mindmetrics: frontend

React + Vite + TypeScript + Tailwind + React Router + Lucide + Recharts. Educational project, not a clinical tool.

## Run locally

    npm install
    echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env.local
    npm run dev        # http://localhost:5173

`.env.local` overrides the committed `.env`, which points at the deployed backend. The backend must be running
locally (see the backend README) or you can leave `.env.local` out to use the deployed one.

## Environment variables

| Name | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL, read at **build** time (e.g. `https://mindmetrics-cbbz.onrender.com`) |

The backend only accepts requests from origins listed in its `ALLOWED_ORIGINS` setting. If you move the frontend
to a new URL, add that origin there.

## Scripts

    npm run dev      # dev server
    npm run build    # type-check + production build into dist/
    npm run lint     # oxlint
    npm run preview  # serve the production build locally

## Deploy on Render (static site)

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL`
- If the app uses `BrowserRouter`, add a rewrite rule `/*` to `/index.html` so direct links to `/assessment`,
  `/dashboard` and `/about` don't 404.
