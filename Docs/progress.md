# Anamnesis — Progress Log

Tracks progress against `Docs/Implementation-Plan.md`. Add a dated entry every time a checklist item is completed or a notable decision/blocker comes up. Newest entries at the top.

---

## Status Snapshot

| Phase | Status |
|---|---|
| 0 — Infra & Environment Setup | **Complete** |
| 1 — Remember | Not started |
| 2 — Recall | Not started |
| 3 — Improve | Not started |
| 4 — Forget | Not started |
| 5 — Dashboard Assembly | Not started |
| 6 — Demo Polish & Submission | Not started |

---

## Log

### 2026-07-02 (5) — Phase 0 complete
- Wired Clerk authentication, completing Phase 0.
- Fixed a key-placement mix-up first: user had added the Clerk keys to the root `.env` (the Docker Compose file for the local Cognee stack), not `.env.local` (what Next.js actually reads). Moved them to the right file, and split env docs cleanly: `.env`/`.env.example` = local Docker stack only; `.env.local`/`.env.local.example` (new) = Next.js app secrets only. Each file now has a header explaining its scope so this doesn't happen again.
- `npm install @clerk/nextjs` (7.5.12). Verified actual exports against the installed package rather than trusting fetched docs blindly (`Show`, `ClerkProvider`, `SignInButton`, `UserButton`, `clerkMiddleware`, `createRouteMatcher` all confirmed present).
- **Next.js 16 naming difference caught before writing the file:** Clerk's middleware file is named `proxy.ts`, not `middleware.ts`, on Next.js 16+ (Next.js renamed Middleware → Proxy in v16; contents are identical). Confirmed against the local `node_modules/next/dist/docs` for this exact installed version, not assumed from training data. Created `src/proxy.ts` (inside `src/` since the project uses `--src-dir`), matched by the standard catch-all matcher, marking only `/sign-in` and `/sign-up` as public via `createRouteMatcher` + everything else behind `auth.protect()`.
- Wrapped `src/app/layout.tsx` in `ClerkProvider`, added a header with `SignInButton`/`SignUpButton` (signed-out) / `UserButton` (signed-in) via Clerk's `<Show>` component.
- Built in-app sign-in/sign-up pages at `src/app/sign-in/[[...sign-in]]` and `src/app/sign-up/[[...sign-up]]` (Clerk's standard optional-catch-all convention), and pointed Clerk at them explicitly via `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` — otherwise `auth.protect()` would redirect to Clerk's hosted Account Portal instead of our own pages.
- **Verified locally:** unauthenticated `GET /` → clean `307` to `/sign-in?redirect_url=...` → `200` with real Clerk sign-in UI rendered; protected API routes (`/api/cognee/health`) also correctly `307` when unauthenticated.
- **Verified on production Vercel:** same protection is active (confirmed via `X-Clerk-Auth-Status: signed-out` headers). Production requests first go through a Clerk dev-instance "handshake" redirect (`causal-bluejay-84.clerk.accounts.dev/v1/client/handshake`) to set a dev-browser cookie — this is standard, documented Clerk behavior for `pk_test_`/`sk_test_` keys (no custom domain), not a bug. Proved it resolves cleanly (not a loop) by manually walking the redirect chain with a proper multi-cookie jar (`Headers.getSetCookie()`) — after 2 hops the handshake cookies (`__client_uat`, `__clerk_db_jwt`) are set and the 3rd redirect correctly lands on `/sign-in`. Real browsers do this automatically and transparently.
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` on Vercel (Production + Development) and redeployed.
- **Known limitation, not a blocker:** using Clerk's development instance keys (`pk_test_`/`sk_test_`), which is why the handshake redirect exists at all — switching to a production Clerk instance (custom domain, no handshake needed) is a pre-launch item, not a hackathon-demo one.
- **Phase 0 is now fully complete.** Every checklist item across infra, deployment, and auth is done and verified against the real, live system — nothing simulated.

### 2026-07-02 (4)
- Scaffolded the Next.js app (16.2.10, App Router, TypeScript, Tailwind) at the repo root via `create-next-app`, then deployed it to Vercel — **live at `https://anamnesis-sigma.vercel.app`**.
- Note: Next.js 16 ships with breaking changes vs. earlier training-era knowledge (route handlers dynamic-by-default under "Cache Components", `RouteContext` helper, etc.) — checked `node_modules/next/dist/docs` before writing route handlers rather than assuming Next 14/15 conventions still applied.
- Added `src/lib/cognee.ts` (server-only helper wrapping `remember()`/`recall()`/health against `COGNEE_API_URL`/`COGNEE_API_KEY`) and three route handlers: `/api/cognee/health`, `/api/cognee/remember`, `/api/cognee/recall`. Home page (`src/app/page.tsx`) is a minimal connectivity-check UI with a visible "Cognee operations log" panel — deliberately built this way from the start per the judging requirement (`CLAUDE.md`) that Cognee calls stay visible, not hidden.
- Vercel env vars set (Production + Development; Preview skipped — requires a connected Git repo, which we don't have yet since this isn't pushed to GitHub): `COGNEE_API_URL`, `COGNEE_API_KEY`, both server-side only (not `NEXT_PUBLIC_*`, so the API key never reaches the browser).
- Added `.vercelignore` after the first deploy warned it detected a `.env` file in the build context — excludes `.env`, `.env.local`, `deploy/`, `docker-compose.yml`, `Docs/` from what gets uploaded to Vercel, even though they're already gitignored (git-ignore and Vercel's own upload filtering are separate mechanisms).
- **Verified live in production** (not just locally): called `/api/cognee/remember` and `/api/cognee/recall` directly against `https://anamnesis-sigma.vercel.app`, got a correct graph-grounded answer back, sourced from the GCP-hosted Cognee instance. This is the real Phase 0 exit criteria, not a simulated one.
- Tightened `CORS_ALLOWED_ORIGINS` on the deployed Cognee instance from `*` to `https://anamnesis-sigma.vercel.app` now that the real domain is known; pushed the updated `deploy/gcp/.env` to the VM and recreated the `cognee` container (confirmed healthy again after restart).
- Cleaned up both smoke-test datasets (`hello_world` local-dev-server test, `vercel_hello_world` production test) via `DELETE /api/v1/datasets/{id}` afterward.
- Local Next.js dev server points at the same deployed Cognee instance via `.env.local` (`COGNEE_API_URL`/`COGNEE_API_KEY`) — there is no separate "local Cognee" story for the app anymore; the local Docker Cognee stack (`docker-compose.yml` at repo root) is now effectively superseded by the deployed instance for app development, though still useful for offline iteration if needed.
- Remaining Phase 0 item: Clerk auth (sign-in, protected routes) — not started.

### 2026-07-02 (3)
- Deployed the self-hosted Cognee stack to a real, internet-reachable host so Vercel (once scaffolded) can actually reach it — local Docker on this machine can't be hit by Vercel's serverless functions.
- **Infra:** new dedicated GCP project `anamnesis-hackathon` (isolated billing/blast-radius, one-command teardown via `gcloud projects delete`), billing linked to existing account. VM `anamnesis-cognee-host` — `e2-medium` (4GB/2vCPU, ~$0.034/hr ≈ $24/mo if left running continuously), `us-central1-a`, static IP `35.232.55.105`, dedicated VPC `anamnesis-net`. Chose GCP over AWS for ~20% lower cost at the same size (compared real AWS Pricing API numbers vs. published GCP rates); user decided.
- **Firewall:** SSH restricted to operator's IP + Google's IAP range (`35.235.240.0/20` — required for `--tunnel-through-iap`, missed on the first attempt and cost a stuck 10-minute retry loop before catching it). Ports 80/443 open publicly. Everything else (8000 Cognee, 5432 Postgres, 7474/7687 Neo4j) is **not** published to the host at all in `deploy/gcp/docker-compose.yml` — only reachable from other containers on the internal Docker network.
- **TLS:** no domain purchased — using the static IP with nip.io (`35-232-55-105.nip.io`), fronted by Caddy (`deploy/gcp/Caddyfile`) which auto-issued a real Let's Encrypt cert. Verified with `curl -v` that the cert is real, not self-signed.
- **Auth posture changed for this deployment vs. local dev:** `REQUIRE_AUTHENTICATION=true` (local dev stack stays `false`, since it's not internet-reachable). Registered an admin user, minted a durable API key via `/api/v1/auth/api-keys`, confirmed unauthenticated requests get `401` and authenticated ones (via `X-Api-Key` header) succeed. Full credentials in `deploy/gcp/CREDENTIALS.md` (gitignored, not in this log).
- **Verified end-to-end over the public HTTPS endpoint:** synthetic patient note → `remember()` (Gemini cognify, ~19s) → `recall()` returned the correct answer with `"source":"graph"` (confirms Neo4j traversal, not just vector similarity) → cleaned up the smoke-test dataset afterward.
- Resource limits added per-container (`deploy: resources: limits`) to keep Cognee/Postgres/Neo4j collectively within the 4GB host — not present in the local dev compose file, which assumes a much bigger dev machine.
- `.gitignore` extended to cover `deploy/**/.env` and `deploy/**/CREDENTIALS.md`.
- **Cost control documented in `deploy/gcp/CREDENTIALS.md`:** `gcloud compute instances stop` between work sessions to pause billing on compute; `gcloud projects delete anamnesis-hackathon` for full teardown after the hackathon.
- **Known gap:** the admin user's login password was generated randomly, used once to mint the API key, and deliberately not retained (no SMTP configured on this instance for password reset, and the API key — not the password — is the credential the Next.js app actually needs). If interactive dashboard/browser login is ever needed later, a new credential path will need to be set up then.
- Next: Next.js scaffold needs `COGNEE_API_URL=https://35-232-55-105.nip.io` and `COGNEE_API_KEY=<from CREDENTIALS.md>` as Vercel env vars once the app exists.

### 2026-07-02 (2)
- Self-hosted Cognee stack is live and verified end-to-end.
- `docker-compose.yml` (repo root) runs three services: `cognee/cognee:1.2.2` (API, port 8000), `pgvector/pgvector:pg17` (relational + vector store), `neo4j:5.26` (graph store, browser on 7474, bolt on 7687). Config verified directly against `topoteretes/cognee` main branch (`.env.template`, `docker-compose.yml`, `.github/workflows/test_llms.yml`) on this date — Cognee ships prebuilt Docker Hub images (`cognee/cognee`, `cognee/cognee-mcp`), so we pull rather than build from source.
- `ENABLE_BACKEND_ACCESS_CONTROL=false` and `REQUIRE_AUTHENTICATION=false` — deliberate for this single-tenant hackathon demo. Note: backend access control's supported graph backends are KuzuDB / neo4j_aura_dev only, not a plain self-hosted Neo4j container, so multi-tenant mode wasn't an option here anyway.
- LLM/embeddings: Gemini (`LLM_PROVIDER=gemini`, `LLM_MODEL=gemini/gemini-3-flash-preview`, `EMBEDDING_MODEL=gemini/gemini-embedding-001`, 768 dims) — confirmed against Cognee's own CI Gemini test job, not guessed.
- Added `.env.example` (documented, safe to commit) and `.env` (real keys, gitignored). User filled in their own Gemini key in `.env`.
- Verified full lifecycle against a synthetic clinical note: `POST /api/v1/remember` (multipart file upload, dataset "smoketest") → 200, `items_processed: 1`, ~21s (ingest + Gemini cognify). `POST /api/v1/recall` on the same dataset returned a correct graph-grounded answer with `"source":"graph"`, confirming Neo4j traversal is actually driving the response, not just vector similarity.
- Cleaned up: deleted the "smoketest" dataset via `DELETE /api/v1/datasets/{id}` after verification so it doesn't pollute later demo data.
- All three containers report `healthy` via Docker healthchecks.
- Confirmed API surface includes the full memory lifecycle: `/api/v1/remember`, `/recall`, `/improve`, `/forget`, `/memify` — matches PRD's four core operations exactly. `improve()`/`memify()`/`forget()` endpoints exist but haven't been exercised yet (Phases 3–4).
- Blocker encountered and resolved: Docker Desktop's engine wasn't running initially (`dockerDesktopLinuxEngine` pipe not found) — started Docker Desktop and waited for the daemon before `docker compose up` succeeded.
- Remaining Phase 0 work: Next.js + TypeScript + Tailwind scaffold, Vercel deploy skeleton, Clerk auth wiring, and confirming a Vercel serverless function can reach this local Cognee instance (will matter once we're not running everything on one machine — needs a plan for how Vercel reaches a self-hosted instance, e.g. tunnel for local dev vs. a real host for the actual demo).

### 2026-07-02 (1)
- PRD updated: architecture switched from Cognee Cloud to self-hosted, open-source Cognee — targeting the "Best Use of Open Source" track for the hackathon (data sovereignty rationale: patient PHI should not leave infrastructure we control).
- Created `Docs/Implementation-Plan.md` (Phases 0–6, mirrors PRD §12 MVP + §13 Demo Flow) and `CLAUDE.md`.
- No code written yet.
