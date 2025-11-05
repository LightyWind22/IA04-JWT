# IA03 — User Registration (NestJS + React)

A monorepo with a NestJS backend API and a React (Vite + Tailwind + shadcn/ui) frontend implementing user registration and login flows.

## Project structure

- `backend/user-registation-api` — NestJS API (TypeScript)
- `frontend/user-registration-app` — React + Vite frontend (TypeScript)

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (or a cloud URI)

## Backend — run locally

1) Configure environment

Create `backend/user-registation-api/.env` with at least (see `backend/user-registation-api/env.example`):

```
MONGODB_URI=mongodb://localhost:27017/user-registration
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

2) Install and start (Windows PowerShell)

```powershell
cd backend\user-registation-api
npm ci
npm run start:dev
```

3) API endpoints (base URL from env)

- `POST ${BASE_URL}/user/register` — create account
  - body: `{ "email": string, "password": string }`
  - responses: success JSON or error message (email exists / validation)
- `POST ${BASE_URL}/user/login` — authenticate
  - body: `{ "email": string, "password": string }`
  - returns a token-like payload used by the frontend to simulate auth

Notes
- DTO validation is enabled; passwords are hashed before saving.
- CORS is enabled for the frontend origin.

## Frontend — run locally

1) Install and start (Windows PowerShell). Create `frontend/user-registration-app/.env` from `frontend/user-registration-app/env.example`:

```
VITE_API_BASE_URL=http://localhost:3000
```

```powershell
cd frontend\user-registration-app
npm ci
npm run dev
```

2) Open `http://localhost:5173`

3) Pages and routes

- `/` — Welcome (landing, choose Login or Register)
- `/register` — Register form with React Hook Form + Zod + React Query (calls backend `/user/register`)
- `/login` — Login form with validation (calls backend `/user/login`); on success redirects to `/home`
- `/home` — Post-login page; simple token guard using `localStorage.token`

Styling
- TailwindCSS with shadcn/ui primitives (e.g., `components/ui/button.tsx`)
- Theme variables defined in `src/index.css` (`:root` and `.dark`)
- `postcss.config.js` present to ensure Tailwind is processed by Vite

## Scripts reference

Backend (from `backend/user-registation-api`):
- `npm run start:dev` — run Nest in watch mode
- `npm run build` — compile to `dist/`
- `npm run start:prod` — run compiled `dist/main.js`

Frontend (from `frontend/user-registration-app`):
- `npm run dev` — start Vite dev server (port 5173)
- `npm run build` — build to `dist/` (static assets for hosting)
- `npm run preview` — preview production build locally

## Local troubleshooting

- Tailwind styles not applied: ensure `postcss.config.js` exists and restart `npm run dev`.
- Background image: assets live under `public/`; CSS uses `/images/bg.webp`.
- PowerShell chaining: use `;` instead of `&&` when chaining commands.

## Deploy (summary)

- Frontend: deploy `frontend/user-registration-app/dist` to static hosting (Vercel/Netlify/Cloudflare Pages).
- Backend: deploy `backend/user-registation-api` (Render/Railway/Fly/Docker). Set env `MONGODB_URI`, `PORT`, and CORS origin. Build with `npm run build`, start `node dist/main.js`.

## License

This project is for educational purposes within the IA03 exercise.
