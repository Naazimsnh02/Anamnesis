# Anamnesis

Persistent clinical memory platform, built for the "The Hangover Part AI: Where's My Context?" hackathon (wemakedevs.org/hackathons/cognee, June 29 – July 5, 2026), targeting the **Best Use of Open Source** track.

Full product spec: `Docs/Anamnesis-PRD.md`
Build plan: `Docs/Implementation-Plan.md`
Progress log: `Docs/progress.md` — update this after finishing any checklist item from the Implementation Plan.

## What this is

Anamnesis turns fragmented patient records (blood reports, prescriptions, discharge summaries, imaging reports) into a living, connected clinical memory using Cognee's four memory operations: `remember()`, `recall()`, `improve()`/`memify()`, `forget()`.

## Critical constraint: self-hosted Cognee, not Cognee Cloud

This is a deliberate architecture decision, not a placeholder:

- Patient data is PHI. It must not leave infrastructure we control.
- The hackathon's "Best Use of Open Source" track requires building on self-hosted Cognee — do not swap in Cognee Cloud SDK/endpoints to save setup time.
- Backing stores: Postgres + pgvector (vector), self-hosted graph backend. No third-party managed data stores in the patient-data path.

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
