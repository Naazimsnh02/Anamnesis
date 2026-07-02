# Anamnesis

Persistent clinical memory platform. Originally built for the "The Hangover Part AI: Where's My Context?" hackathon (wemakedevs.org/hackathons/cognee, June 29 – July 5, 2026, **Best Use of Open Source** track) — as of 2026-07-02 the project's target shifted from "hackathon submission" to **building this as a real, launchable product**, end to end. The hackathon build (Phases 0–4) is the foundation, not the ceiling.

Full product spec: `Docs/Anamnesis-PRD.md`
Build plan: `Docs/Implementation-Plan.md`
Progress log: `Docs/progress.md` — update this after finishing any checklist item from the Implementation Plan.

**Status: Phases 0–4 complete** (infra/deploy/auth, Remember, Recall, Improve, Forget — single hardcoded demo patient, verified live against the deployed Cognee instance). Live app: `https://anamnesisai.vercel.app`. Now building Phase 5 (multi-tenant foundation: orgs, clinicians, real patient roster) — see `Docs/Implementation-Plan.md`.

## Production scope decisions (confirmed 2026-07-02)

Three scope-defining questions were answered when the target shifted to production. Revisit only if explicitly told to:

- **Data:** architecture-ready for real PHI (multi-tenant, audited, encrypted), but **only synthetic data until compliance work (BAAs, security review) is actually done** — see "Compliance posture" below. This is a gate, not a formality.
- **Tenancy:** single clinic/org to start. Multiple clinicians and patients under one org; multi-org SaaS onboarding is a later phase, not blocking now.
- **Users:** doctor/clinician-managed only for now. Patients do not get a login or read access to their own record yet — that's an explicitly scoped future phase (write access for patients is out of scope even then; clinical corrections stay clinician-only).

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

## Make Cognee visible (still core, not just for judging)

The product's differentiation is genuinely tied to leaning hard on Cognee's memory lifecycle, so this stays a hard requirement post-hackathon too:

- Every `remember()`/`recall()`/`improve()`/`forget()` call should be traceable in a visible operations log in the UI, not buried behind abstraction. Phase 8 consolidates the current per-page logs into one global, persistent ops panel.
- Don't design around Cognee — design *through* it. If a feature can be done either via Cognee's graph/memory APIs or via a bespoke DB query, prefer Cognee.
- The new Postgres layer (Phase 5) is for **app/tenancy state only** (orgs, clinicians, patient roster, audit log) — it must never become a shadow copy of clinical memory that competes with Cognee's graph. Cognee stays the one source of truth for clinical facts and their relationships.

## Scope discipline

Build what's in `Docs/Implementation-Plan.md` Phases 0–8. Phases 0–4 (hackathon MVP, mirrors PRD §12 + §13) are done. Phases 5–8 are the production build-out (multi-tenant foundation, reliability/security hardening, compliance groundwork, product polish) — see the Implementation Plan for what's in each.

Everything else in the PRD (lab trend charts §7.6, full medication history UI §7.7, relationship explorer §7.8, visit prep §7.9, FHIR/EHR integration, population health, family health memory, clinical trial matching) remains explicit roadmap, not current scope, even under the production target — these are feature-completeness items that don't move any of the six things this product needs to get right first (multi-tenancy, compliance posture, reliability, test coverage, UX cohesion, Cognee depth). If asked to add something outside current phase scope, flag it against the "Explicitly Deferred" list in the Implementation Plan before building.

## Tech stack

- Frontend/Backend: Next.js (App Router), React, TypeScript, Tailwind CSS — API routes as serverless backend, no separate backend service
- Auth: Clerk, using **Clerk Organizations** (Phase 5+) for clinic-level tenancy — an org is a clinic; clinicians belong to one org; patients belong to one org
- App/tenancy database: Postgres (Vercel Postgres/Neon — see Phase 5) for orgs, clinicians, patients, patient roster/status, and audit log. Distinct from Cognee's own internal Postgres+pgvector on the GCP VM, which is Cognee's private backing store and not queried directly by the app.
- Memory engine: self-hosted Cognee (Docker locally, deployed on GCP) — one Cognee dataset per patient, unchanged from the hackathon build
- LLM: Google Gemini API (cognify pipeline, clinical Q&A, vision-based OCR on uploaded documents)
- Hosting: Vercel

## Compliance posture (read before touching real patient data)

This app is being built with production-grade architecture (multi-tenant isolation, audit logging, encryption in transit/at rest) but **has not cleared the bar for real PHI yet**. Concretely, real patient data must not enter this system until all of the following are true:

- Signed BAAs (Business Associate Agreements) in place with every vendor in the data path: Vercel, the GCP project hosting Cognee, Clerk, and Google (Gemini API — currently used for OCR/extraction on uploaded documents and the cognify pipeline).
- A real security/access review of the multi-tenant isolation added in Phase 5 (org-scoping on every API route and DB/Cognee call).
- A data retention/deletion policy that's actually implemented, not just documented, including how `forget()` calls and patient/org offboarding propagate deletion through Postgres, Cognee's graph/vector stores, and Vercel Blob.

Until then: **all patient data used anywhere in this repo, in dev, and in any deployed environment must be synthetic.** Never introduce real PHI into this repo, logs, or any external service (including LLM API calls). This is unchanged from the hackathon rule — it just now has a defined exit condition instead of being permanent.

## Workflow expectations

- After completing a checklist item in `Docs/Implementation-Plan.md`, mark it done there and add a dated entry to `Docs/progress.md`.
- Keep changes scoped to the current phase; don't jump ahead to later phases without checking in.
- Infra/billing actions (provisioning a new database, creating cloud resources, etc.) get confirmed with the user before executing, same as any other hard-to-reverse action — production scope doesn't change that bar.
