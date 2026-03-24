# Deploying this project on Vercel

This repo is a **traditional Node/Express app** with **Socket.IO**, **MySQL sessions**, **EJS**, and **disk-based uploads**. Vercel runs it as a **single serverless function** (see [Express on Vercel](https://vercel.com/docs/frameworks/backend/express)). Below is how that maps to **this** codebase.

## Build (fixed)

- Use **`npm run build` → `npx tsc`** so the TypeScript compiler is not blocked by `Permission denied` on `node_modules/.bin/tsc` in Linux CI.

## What Vercel expects

| Topic | This project | On Vercel |
|--------|----------------|-----------|
| **Entry** | `src/app.ts` (Express + `http.Server`) | Vercel can detect Express at `src/app.ts` (or export `app`). Prefer **Framework Preset: Express** in the project settings. |
| **Static files** | `express.static(.../public)` | **`express.static()` is ignored**; put assets in repo root **`public/`** — they are served from the CDN. Keep URLs like `/css/...` the same. |
| **Views** | `views/` via `path.join(__dirname, "../views")` from `dist/` | Paths must still resolve after deploy. Keeping `views/` at the **repo root** (as now) is correct when the function runs from a layout where `dist/` sits next to `views/`. If templates 404, adjust paths or include `views` in the function bundle explicitly. |
| **Sessions** | `express-mysql-session` + MySQL | DB must accept connections **from the internet** (firewall / RDS public / etc.). Pool settings may need tuning for many short-lived invocations. |
| **Trust proxy** | Not set | **Required** behind Vercel for correct IPs and secure cookies — `app.set("trust proxy", 1)` is added in `app.ts` when `VERCEL` is set. |
| **Env vars** | `.env` locally | Set all variables from `.env.example` in **Vercel → Settings → Environment Variables**. |

## High-risk / incompatible areas

### 1. Socket.IO (real-time)

The app attaches **Socket.IO** to the same `http.Server` (`src/app.ts`, `src/middlewares/socketIO.ts`, controllers emit events).

- Vercel’s model is **request/response serverless**; **persistent WebSockets** are not a good fit for the same deployment.
- **Expect live features** (e.g. `new-vote`, `user-import-*`, register-device flows using `res.locals.io`) **to be unreliable or broken** unless you move realtime to a **separate** service (e.g. dedicated Node host, Pusher/Ably, or another platform that supports long-lived WebSocket servers).

### 2. Multer → disk (`src/config/multerConfig.ts`)

Uploads are written under **`public/img/candidate_profiles`**.

- Serverless filesystems are **ephemeral** and not a durable place for user uploads.
- **Candidate image uploads will not behave like on a VPS** unless you switch to **`memoryStorage`** (or stream) and then **upload to S3 / R2 / similar**, or host the API on a VM/container (Railway, Render, Fly.io, VPS).

### 3. Long-lived process assumptions

`SIGTERM` / graceful shutdown handlers are fine locally; on Vercel the runtime may freeze or recycle the instance at any time — design for **stateless HTTP** where possible.

## Suggested platforms if Vercel is painful

For **this stack as-is** (Socket.IO + disk uploads + MySQL), a **container or long-running Node host** usually needs fewer changes:

- Railway, Render, Fly.io, a small VPS, or Azure App Service **with a persistent disk** if you keep local file storage.

## Quick checklist before deploy

1. `npm run build` passes locally (`npx tsc`).
2. Vercel **Environment Variables** match `.env.example` (DB host must be reachable from Vercel’s regions).
3. **Framework**: Express (if offered).
4. Accept or plan around **Socket.IO** and **file upload** limitations above.
5. After deploy: test **login/session** (cookie + HTTPS) and **DB connectivity** first; then realtime and uploads.
