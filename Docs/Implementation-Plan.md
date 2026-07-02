# Anamnesis — Phase-Wise Implementation Plan

Originated as a hackathon build: "The Hangover Part AI: Where's My Context?" (June 29 – July 5, 2026), Best Use of Open Source track (self-hosted Cognee).

**As of 2026-07-02, the target changed from "hackathon submission" to "real, launchable product."** Phases 0–4 below are the hackathon MVP (PRD §12 + §13) and are complete — that scope note is preserved as history. Phases 5–8 are the production build-out and supersede the old Phase 5/6 (Dashboard Assembly / Demo Polish); see the note at the start of Phase 5.

PRD §7.6–7.9 (lab trends, full medication history, relationship explorer, visit prep), §10's full dashboard beyond what's in Phases 5–8, and §15 (FHIR/EHR, wearables, population health, etc.) remain explicitly out of scope — see "Explicitly Deferred" at the bottom. Production-grade engineering (multi-tenancy, compliance posture, reliability, tests) is the priority over additional feature surface.

---

## Phase 0 — Infra & Environment Setup

Goal: a running self-hosted Cognee instance reachable from a Next.js app, with auth and API keys wired.

- [x] Stand up self-hosted Cognee (Docker) with Postgres + pgvector as vector store and Neo4j as graph backend
- [x] Verify `remember()` / `recall()` calls work against a trivial test dataset (`memify()`/`forget()` endpoints confirmed present, exercised in later phases)
- [x] Get Gemini API key (AI Studio free tier) for cognify pipeline + vision OCR
- [x] Deploy the stack to a real, internet-reachable host (GCP e2-medium VM, `deploy/gcp/`) behind Caddy/TLS, with `REQUIRE_AUTHENTICATION=true` and an API key minted for the Next.js app — see `deploy/gcp/CREDENTIALS.md`
- [x] Scaffold Next.js + TypeScript + Tailwind app, deploy skeleton to Vercel
- [x] Wire Clerk auth (sign-in, protected routes) — all routes protected via `src/proxy.ts` (`clerkMiddleware` + `auth.protect()`), except `/sign-in` and `/sign-up`; verified locally and on production Vercel
- [x] Confirm Vercel serverless functions can reach the deployed Cognee instance using `COGNEE_API_URL` + `COGNEE_API_KEY` — verified live: `remember()` and `recall()` both called from the production Vercel URL and got correct graph-grounded answers back

Exit criteria: a hello-world API route on Vercel can call the deployed Cognee instance's `remember()` and get a response back. **Met** — confirmed live against production.

**Phase 0 is complete.**

---

## Phase 1 — Remember: Document Import → Structured Memory

Goal: upload a medical document and see it become structured, connected memory.

- [x] Upload UI (PDF / image) for: blood report, prescription, discharge summary — `src/app/remember/page.tsx`
- [x] Gemini vision extraction: pull structured medical entities (diagnosis, medication, lab value, date) from uploaded file — `src/lib/gemini.ts`
- [x] Map extracted entities into Cognee `remember()` calls, building the per-patient graph (Patient → Condition → Medication → Lab Value → Date, per PRD §8) — `src/lib/narrative.ts` + `POST /api/documents/upload`
- [x] Persist a visible "Cognee operations log" (what got remembered, when) — required for judging visibility into Cognee usage — client-side log panel on `/remember`, same pattern as `/debug`
- [x] Seed 2–3 years of synthetic patient history (multiple documents) for demo continuity — `src/lib/seed-data.ts` (10 documents, 2023–2026) + `POST /api/documents/seed`

Exit criteria: uploading a document visibly grows the patient's memory graph; operations log shows the `remember()` calls. **Met** — verified the narrative→remember()→recall() path against the real deployed Cognee instance.

---

## Phase 2 — Recall: Smart Clinical Search

Goal: doctors ask natural-language questions and get graph-grounded answers, not document search.

- [x] AI Assistant chat UI — `src/app/assistant/page.tsx`
- [x] Query → Cognee `recall()` → graph traversal → Gemini reasoning → evidence-linked answer — single `recall()` call with `search_type=GRAPH_COMPLETION` (Cognee's backend already runs graph traversal + Gemini reasoning internally, confirmed live), `includeReferences: true` — `src/lib/cognee.ts` + `src/app/api/cognee/recall/route.ts`
- [x] Support PRD §9 sample questions (kidney function decline, first diagnosis date, medication side-effect timeline, etc.) — all 8 rendered as clickable chips
- [x] Response must show the evidence chain (which nodes/edges were traversed), not just prose — `src/lib/evidence.ts` parses Cognee's evidence citations (doc type, date, source snippet) into structured, numbered evidence chain
- [x] Operations log shows `recall()` calls per query — same mono log-panel pattern as `/remember`

Exit criteria: asking "Why is kidney function declining?" returns a reasoned, evidence-chain answer sourced from the graph. **Met** — verified live against the deployed Cognee instance and the seeded patient history; correctly cites CKD Stage 3 / declining eGFR with 5 sourced document chunks.

---

## Phase 3 — Improve: Memory Enrichment on New Data

Goal: uploading a new report visibly enriches prior diagnoses/relationships, and the graph updates live.

- [x] Upload a new document mid-demo (e.g., nephrologist report) — existing `/remember` upload flow, exercised live with a follow-up nephrology note
- [x] Trigger Cognee `improve()`/`memify()` to link new entities to existing history — `cogneeImprove()` in `src/lib/cognee.ts`, called automatically after every `remember()` in `POST /api/documents/upload`
- [x] Live graph view that visibly updates after ingestion — `src/components/GraphView.tsx` (d3-force layout, SVG), embedded on `/remember`, refetches after every upload/seed
- [x] Re-ask the same recall question from Phase 2 and show a richer answer — verified live (see below)

Exit criteria: same question asked before/after new upload produces a visibly different, richer answer — this is the demo's core "wow" moment. **Met** — verified live against the deployed instance.

---

## Phase 4 — Forget: Correction & Archival

Goal: show intelligent forgetting without data loss.

- [x] Mark a diagnosis as "ruled out" → app-level roster status flips (`src/lib/roster.ts`) + a `remember()`/`improve()` correction narrative teaches the graph, since Cognee's real `forget()` is document/dataset-scoped, not entity-scoped (confirmed against the live instance's OpenAPI spec) — removes it from active summary, keeps it in historical record
- [x] Mark a medication as discontinued → same pattern, moves to Medication History, out of "Current Medications" — `POST /api/documents/status`
- [x] Duplicate document merge (upload a near-duplicate report, show merge instead of duplication) — literal `forget(dataId)` on the superseded document + `remember()` the new one, `src/app/api/documents/upload/route.ts`
- [x] Patient Summary view updates automatically to reflect forgotten/archived items — `src/app/summary/page.tsx`, reads `GET /api/documents/roster`
- [x] Operations log shows `forget()` calls distinctly from `remember()`/`recall()` — `/summary` and `/remember` log panels label `forget()` merges separately

Exit criteria: marking something ruled-out/discontinued immediately changes the active summary while the record remains recoverable in history. **Met** — verified live against the deployed Cognee instance.

---

## Phase 5 — Multi-Tenant Foundation

**Supersedes the original "Dashboard Assembly" phase** (2026-07-02 scope change: production target, not hackathon demo surface). Goal: replace the single hardcoded demo patient with a real clinic/clinician/patient model, so the app can hold more than one patient without every route being rewritten later.

- [x] Provision a Vercel-reachable Postgres (Vercel Postgres/Neon) for app/tenancy state — Neon via `vercel integration add neon`, connected to the project
- [x] Schema: `orgs`, `clinicians`, `patients`, `patient_assignments`, `audit_log` — plus roster tables replacing `src/lib/roster.ts`'s Vercel-Blob-JSON pattern (diagnoses/medications with active/ruled-out/discontinued status, document registry for dedup) — `src/lib/db/schema.ts`, pushed live via Drizzle
- [x] Wire Clerk Organizations: an org = a clinic; clinicians belong to one org. `src/proxy.ts` and every route under `src/app/api/**` require an active org and scope all DB/Cognee calls by `orgId` — `src/lib/db/queries.ts`'s `requireOrgContext()`/`requirePatientContext()`
- [x] Patient list/switcher UI; replaced `DEMO_PATIENT` (`src/lib/patient.ts`) across `/remember`, `/assistant`, `/summary`, `GraphView` with a patient-scoped selection backed by the new DB — `src/components/PatientSwitcher.tsx`, `src/lib/useActivePatient.ts`
- [x] Seed 2–3 synthetic patients under one demo org (single-org-to-start per the confirmed scope decision) — `POST /api/patients/seed-demo`, `src/lib/seed-data.ts`'s `SEED_PATIENTS`
- [x] Audit log table exists (`audit_log` in schema) — **not yet wired into any route** (no calls populate it yet); tracked as a Phase 6 follow-up, not blocking Phase 5's exit criteria
- [x] **Unplanned but load-bearing:** discovered and fixed a real cross-patient data isolation gap in the deployed Cognee instance (Neo4j Community couldn't support per-dataset access control; migrated to embedded Kuzu + fixed a session-cache leak). See `Docs/progress.md` 2026-07-02 (14)/(15) — this blocked and then unblocked everything else in this phase.

Exit criteria: a clinician can sign in, see a roster of their org's patients, select one, and every existing Phase 1–4 feature (remember/recall/improve/forget) works against the selected patient instead of a hardcoded one.

---

## Phase 6 — Reliability & Security Hardening

Goal: the app behaves correctly under real (if still synthetic) multi-user, multi-patient conditions — not just the happy path a single demo walkthrough exercises.

- [ ] Test suite: unit tests for `evidence.ts`, `narrative.ts`, and the Phase 5 roster/DB logic; contract tests for API routes against a mocked Cognee client
- [ ] Error-handling audit across `src/app/api/**` — consistent error responses, and corresponding loading/error/empty UI states on every page
- [ ] Rate limiting on write routes (upload, status-change)
- [ ] Observability: error tracking (e.g. Sentry) + structured logs, covering both the Vercel app and the GCP Cognee VM
- [ ] Backups: automated snapshots for the GCP stack's Postgres+pgvector and Neo4j (currently none)
- [ ] Push the repo to GitHub (currently local-only) and add CI (lint + build + test on push)

Exit criteria: `npm run build`/`lint`/`test` all clean and enforced in CI; a bad upload or a Cognee timeout produces a handled error state, not a crash.

---

## Phase 7 — Compliance Groundwork

Goal: architecture and documentation only — **not** a green light to use real PHI. Real patient data stays out of scope until every item here is actually true, not just written down (see `CLAUDE.md` "Compliance posture").

- [ ] Document the compliance gap explicitly in the README/roadmap: BAAs needed with Vercel, GCP, Clerk, and Google (Gemini) before any real PHI
- [ ] Confirm encryption at rest for Postgres/Neo4j/Blob storage; confirm TLS everywhere (Cognee endpoint already covered)
- [ ] Write the data retention/deletion story end-to-end: what actually happens across Postgres, Cognee's graph/vector stores, and Vercel Blob when a `forget()` call fires or a patient/org is offboarded

Exit criteria: a written, accurate compliance gap analysis exists, and nothing in the codebase implies real-PHI-readiness that isn't actually true yet.

---

## Phase 8 — Product Polish

Goal: the app reads as one coherent product, not four separately-built pages.

- [ ] Unified dashboard shell (persistent nav/sidebar, patient header) wrapping `/remember`, `/assistant`, `/summary`, graph view
- [ ] Consistent design system usage across all app pages (reuse the landing page's tokens, not default Tailwind)
- [ ] Global, persistent Cognee operations panel — consolidates the current per-page logs into one place showing remember/recall/improve/forget across the whole session; this is the primary "prove we used Cognee deeply" surface
- [ ] Onboarding flow: org signup → invite clinicians → add patients (replaces the single seed-button flow)
- [ ] Mobile pass
- [ ] README: problem, solution, architecture diagram, why self-hosted Cognee (data sovereignty angle), compliance posture, how to run locally
- [ ] Rehearse the full demo flow (PRD §13) end-to-end against the new multi-patient surface; record a walkthrough video

Exit criteria: the full demo flow (PRD §13, steps 1–9) runs start-to-finish on the multi-tenant surface without manual data patching, and a new visitor can understand the product from the README alone.

---

## Explicitly Deferred

Not built in Phases 0–8 — tracked here so scope creep is caught early:
- Laboratory Trends charts (§7.6)
- Full Medication History detail (§7.7 beyond basic current/discontinued split)
- Relationship Explorer as a standalone interactive feature beyond the Phase 3 graph view (§7.8)
- Visit Preparation auto-briefs (§7.9)
- Patient-facing portal / patient logins (confirmed 2026-07-02: doctor-managed only for now; patients get no read or write access to their own record yet)
- Multi-org SaaS onboarding beyond the single demo org (confirmed 2026-07-02: single clinic/org to start)
- Billing/plans (Stripe or otherwise) — not addressed until the above is solid
- §15 roadmap items: FHIR/EHR integration, wearables, multi-hospital sync, population health analytics, family health memory, clinical trial matching, etc.
