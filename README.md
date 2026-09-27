# Accora — web application (`admin/`)

React 19 + Vite. Talks to the backend only through `src/lib/api/client.js`.

```bash
npm install
cp .env.example .env      # optional; defaults work with the local backend
npm run dev               # http://localhost:5173 — /api is proxied to http://127.0.0.1:4000
npm run build             # production bundle in dist/
npm run preview
```

Toolchain: Vite 7 with the WebAssembly builds of Rollup and esbuild (`overrides` in `package.json`), so no native binaries are needed — Windows Smart App Control blocks unsigned ones. Builds take ~30 s.

Start the backend first (`cd ../backend && npm start`). In development, `/dev/ui` shows every foundation component (excluded from production builds).

- `src/styles/tokens.css` — design tokens (colour, type, spacing, radius, shadow, glass, motion) for light and dark themes.
- `src/components/ui`, `src/components/finance` — reusable components; financial components format backend values and never calculate them.
- `src/layouts` — app shell, navigation map, brand.
- `src/providers` — theme, auth session (from `GET /auth/me`), toasts.
- `src/routes` — router and session guards.

## Deploy (Vercel)

`vercel.json` builds with `npm run build`, serves `dist/` and rewrites every path to `index.html` (client-side routes).
Set one environment variable in the Vercel project before building:

- `VITE_API_BASE_URL` — the full API URL, e.g. `https://api.example.com/api/v1`.

The backend must allow the Vercel origin in `CORS_ALLOWED_ORIGINS` (e.g. `https://accora.vercel.app`).
