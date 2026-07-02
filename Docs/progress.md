# Anamnesis — Progress Log

Tracks progress against `Docs/Implementation-Plan.md`. Add a dated entry every time a checklist item is completed or a notable decision/blocker comes up. Newest entries at the top.

---

## Status Snapshot

| Phase | Status |
|---|---|
| 0 — Infra & Environment Setup | In progress (Cognee stack live; Next.js/Clerk/Vercel skeleton still pending) |
| 1 — Remember | Not started |
| 2 — Recall | Not started |
| 3 — Improve | Not started |
| 4 — Forget | Not started |
| 5 — Dashboard Assembly | Not started |
| 6 — Demo Polish & Submission | Not started |

---

## Log

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
