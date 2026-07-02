# Anamnesis

Persistent clinical memory platform, built for the "The Hangover Part AI: Where's My Context?" hackathon (wemakedevs.org/hackathons/cognee, June 29 – July 5, 2026), targeting the **Best Use of Open Source** track.

Full product spec: `Docs/Anamnesis-PRD.md`
Build plan: `Docs/Implementation-Plan.md`
Progress log: `Docs/progress.md` — update this after finishing any checklist item from the Implementation Plan.

**Status: Phase 0 (infra/deploy/auth) is complete.** Live app: `https://anamnesisai.vercel.app`. Next up is Phase 1 (Remember: document upload UI) — see `Docs/Implementation-Plan.md`.

## What this is

Anamnesis turns fragmented patient records (blood reports, prescriptions, discharge summaries, imaging reports) into a living, connected clinical memory using Cognee's four memory operations: `remember()`, `recall()`, `improve()`/`memify()`, `forget()`.

## Critical constraint: self-hosted Cognee, not Cognee Cloud

This is a deliberate architecture decision, not a placeholder:

- Patient data is PHI. It must not leave infrastructure we control.
- The hackathon's "Best Use of Open Source" track requires building on self-hosted Cognee — do not swap in Cognee Cloud SDK/endpoints to save setup time.
- Backing stores: Postgres + pgvector (vector), Neo4j (graph). No third-party managed data stores in the patient-data path.

## Deployed Cognee instance

A real, internet-reachable Cognee instance is already running — this is not local-only.

- URL: `https://35-232-55-105.nip.io` (GCP `e2-medium` VM, project `anamnesis-hackathon`, behind Caddy/TLS)
- Auth required: send `X-Api-Key: <key>` on every `/api/v1/*` call except `/health`. Get the key from `deploy/gcp/CREDENTIALS.md` (gitignored — not in this file).
- Local Docker stack (`docker-compose.yml` at repo root) is for dev/iteration only — `REQUIRE_AUTHENTICATION=false` there since it's not internet-reachable. The deployed instance (`deploy/gcp/`) has `REQUIRE_AUTHENTICATION=true`.
- The Next.js app reads `COGNEE_API_URL` / `COGNEE_API_KEY` from environment variables (never hardcode either) — see `src/lib/cognee.ts`. Set locally via `.env.local` (gitignored), set on Vercel via `vercel env` (already configured for Production + Development).
- To change the deployed stack's config: edit files under `deploy/gcp/`, then follow the redeploy steps in `deploy/gcp/CREDENTIALS.md`.

## Deployed Next.js app

Live at `https://anamnesisai.vercel.app` (Vercel project `anamnesis`, not yet connected to a Git repo — deploys happen via `vercel deploy --prod` from this machine, not git push). Route handlers under `src/app/api/cognee/` proxy to the deployed Cognee instance server-side, so `COGNEE_API_KEY` never reaches the browser.

## Auth (Clerk)

Every route is protected by default via `src/proxy.ts` (`clerkMiddleware` + `auth.protect()`), except `/sign-in` and `/sign-up`. Two things worth knowing before touching this:

- **File is named `proxy.ts`, not `middleware.ts`.** Next.js 16 renamed Middleware to Proxy; on Next.js 15 and below it would be `middleware.ts` with identical contents. Don't "fix" this back to `middleware.ts` — it won't run.
- **Env vars for Clerk live in `.env.local`, not the root `.env`.** The root `.env`/`.env.example` are exclusively for the local Docker Cognee stack (`docker-compose.yml` env_file). Clerk and `COGNEE_API_URL`/`COGNEE_API_KEY` (the app's own secrets) live in `.env.local`/`.env.local.example`. These two env systems are unrelated — don't mix them again.
- Using Clerk **development** instance keys (`pk_test_`/`sk_test_`), which means every fresh visitor goes through a one-time cross-domain "handshake" redirect to Clerk's `*.clerk.accounts.dev` domain before landing on the app — this is expected, documented Clerk behavior for dev keys (no custom domain), not a bug. Moving to a production Clerk instance is a pre-launch concern, not a hackathon one.
- Sign-in/sign-up pages are in-app at `src/app/sign-in/[[...sign-in]]` and `src/app/sign-up/[[...sign-up]]` (Clerk's optional-catch-all convention) — `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`NEXT_PUBLIC_CLERK_SIGN_UP_URL` point at them so Clerk doesn't fall back to its hosted Account Portal.

## Judging-driven requirement: make Cognee visible

Judging explicitly scores "how deeply the project leans on Cognee's memory lifecycle APIs." This means:

- Every `remember()`/`recall()`/`improve()`/`forget()` call should be traceable in a visible operations log in the UI, not buried behind abstraction.
- Don't design around Cognee — design *through* it. If a feature can be done either via Cognee's graph/memory APIs or via a bespoke DB query, prefer Cognee.

## Scope discipline

Only build what's in `Docs/Implementation-Plan.md` Phases 0–6 (mirrors PRD §12 MVP + §13 Demo Flow). Everything else in the PRD (lab trend charts, full medication history UI, visit prep, FHIR/EHR integration, population health, etc.) is explicit roadmap — do not implement it during the hackathon build even if it seems quick. If asked to add something outside current phase scope, flag it against the "Explicitly Deferred" list in the Implementation Plan before building.

## Tech stack

- Frontend/Backend: Next.js (App Router), React, TypeScript, Tailwind CSS — API routes as serverless backend, no separate backend service
- Auth: Clerk
- Memory engine: self-hosted Cognee (Docker)
- LLM: Google Gemini API (cognify pipeline, clinical Q&A, vision-based OCR on uploaded documents)
- Hosting: Vercel

## Data handling

All patient data used in development and demos must be synthetic. Never introduce real PHI into this repo, logs, or any external service (including LLM API calls).

## Workflow expectations

- After completing a checklist item in `Docs/Implementation-Plan.md`, mark it done there and add a dated entry to `Docs/progress.md`.
- Keep changes scoped to the current phase; don't jump ahead to later phases without checking in.
