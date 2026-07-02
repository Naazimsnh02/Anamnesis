# Anamnesis — Phase-Wise Implementation Plan

Hackathon: "The Hangover Part AI: Where's My Context?" (June 29 – July 5, 2026)
Target track: Best Use of Open Source (self-hosted Cognee)

Scope for this plan = PRD §12 (Hackathon MVP) + §13 (Demo Flow) only. Anything in PRD §7.6–7.9, §10 (full dashboard), §15 is explicitly out of scope until after the hackathon.

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

## Phase 5 — Dashboard Assembly (MVP Surface Only)

Goal: assemble Phases 1–4 into the coherent demo surface from PRD §10, MVP-scoped only.

- [ ] Patient Overview (active conditions, current meds, allergies, last visit) — derived from live memory state, not hardcoded
- [ ] Timeline view (chronological events from the graph)
- [ ] Memory Graph view (interactive, from Phase 3's live-update work)
- [ ] Documents view (original files + extracted entities side by side)
- [ ] AI Assistant view (from Phase 2)
- [ ] Cognee operations log surfaced somewhere visible (sidebar or dedicated panel) — this is the "prove we used Cognee deeply" surface for judges

Exit criteria: the full demo flow (PRD §13, steps 1–9) can be run start-to-finish without manual data patching.

---

## Phase 6 — Demo Polish & Submission

Goal: rehearsed demo, README, and submission artifacts.

- [ ] Rehearse PRD §13 Demo Flow end-to-end, timed
- [ ] Synthetic patient dataset finalized (3 years of records) — confirm no real PHI anywhere
- [ ] README: problem, solution, architecture diagram, why self-hosted Cognee (data sovereignty angle), how to run locally
- [ ] Record backup demo video in case of live-demo failure
- [ ] Confirm submission meets: demo, README, clear presentation (per hackathon rules)
- [ ] Optional: prep 1–2 blog-track posts and open-source PRs to Cognee if time remains (side tracks)

Exit criteria: submission-ready repo + README + rehearsed live demo + backup video.

---

## Explicitly Deferred (Post-Hackathon Roadmap)

Not built during the hackathon — tracked here so scope creep is caught early:
- Laboratory Trends charts (§7.6)
- Full Medication History detail (§7.7 beyond basic current/discontinued split)
- Relationship Explorer as a standalone interactive feature beyond the Phase 5 graph view (§7.8)
- Visit Preparation auto-briefs (§7.9)
- Phase 2/3 roadmap items (§15): FHIR/EHR integration, wearables, multi-hospital sync, population health analytics, etc.
