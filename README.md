# AI Career Copilot — React Dashboard

Vite + React SPA for the AI Career Copilot API. Lives at `frontend/` in the monorepo.

| Deploy | Host |
|--------|------|
| Monorepo path | `frontend/` |
| Frontend-only GitHub | [jai47/ai-career-copilot](https://github.com/jai47/ai-career-copilot) → **Vercel** |
| API | [jai47/jobs_xSteeorids](https://github.com/jai47/jobs_xSteeorids) on **Railway** |
| Database | Supabase (API only — this app never talks to Supabase directly) |

## Setup

```bash
cp .env.example .env
npm install
```

`.env`:

```env
VITE_API_URL=http://localhost:8000
```

For production builds, set this to your Railway URL (no trailing slash). Vite inlines `VITE_API_URL` at **build** time — change it, then redeploy Vercel.

## Development

```bash
npm run dev
```

Open http://localhost:3000

Or from repo root: `.\scripts\3_start_frontend.ps1`

## Build

```bash
npm run lint
npm run build
npm run preview
```

## Auth UX

- **Create account** → `POST /auth/register`
- **Sign in** → `POST /auth/login`
- Duplicate email shows **Email already exists** (`409 EMAIL_EXISTS`).

## Digest CSV export

**Export CSV** downloads today’s scored opportunities (score ≥ 50) as `digest-YYYY-MM-DD.csv`.

## Architecture

- `src/api/` — typed API client
- `src/context/` — Auth + Profile providers
- `src/hooks/` — `useAsync`, `usePipelinePolling`
- `src/components/` — pages and shared UI
- `src/types.ts` — mirrors backend Pydantic schemas (snake_case)
