# Template Website Starter (Next.js + NeonDB)

This repository contains a batteries-included starter for a template marketplace (or any marketing site) with a dedicated frontend and backend:

- `frontend/` – Next.js 15 (App Router, TypeScript, Tailwind, React Compiler) consuming the backend via typed helpers.
- `backend/` – Express + TypeScript API connected to [Neon](https://neon.tech/) using the official serverless driver.

## Prerequisites

- Node.js 18.17+ (or 20+ for the best Next.js experience)
- An empty Neon Postgres database and its connection string

## Environment variables

### Backend

Copy `backend/.env.example` to `backend/.env` and update:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Full Neon connection string |
| `PORT` | Port for the Express server (defaults to `4000`) |
| `ALLOWED_ORIGINS` | Optional comma-separated origins for CORS (e.g. `http://localhost:3000`) |

### Frontend

Copy `frontend/.env.local.example` to `frontend/.env.local` and update:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | URL of the backend server (defaults to `http://localhost:4000`) |

## Running locally

In two terminals (or background processes):

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

- Next.js runs on `http://localhost:3000` by default.
- The backend exposes `/api/health` and `/api/templates` for the UI to consume.

## Deploying

- Deploy the frontend to Vercel, Netlify, or any platform that supports Next.js 15. Remember to set `NEXT_PUBLIC_BACKEND_URL` to the deployed API URL.
- Deploy the backend to Render, Railway, Fly.io, etc. Provide `DATABASE_URL` (from Neon) and keep `ALLOWED_ORIGINS` in sync with your frontend domains.

## Extending the starter

- Replace the placeholder SQL (`VALUES (...)`) in `backend/src/server.ts` with your actual schema. You can introduce an ORM such as Drizzle or Prisma for migrations and type-safe queries.
- Expand the `/api/templates` route or add new ones for authentication, content management, or billing.
- On the frontend, add new sections/components inside `src/app` and wire them up with the backend helpers inside `src/lib/api.ts`.

Happy building!

