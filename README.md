<p align="center">
  <img src="public\logo_white_bg.png" alt="Anamnesis" width="120" />
</p>

<h1 align="center">Anamnesis</h1>
<p align="center"><i>Every patient's story. Remembered.</i></p>

<p align="center">
  <a href="https://anamnesisai.vercel.app"><img src="https://img.shields.io/badge/Live%20App-anamnesisai.vercel.app-1f6feb?style=flat-square" alt="Live App"></a>
  <img src="https://img.shields.io/badge/Hackathon-Cognee:%20Best%20Use%20of%20Open%20Source-orange?style=flat-square" alt="Hackathon Track">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Memory%20Engine-Cognee%20(self--hosted)-8A2BE2?style=flat-square" alt="Memory Engine">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

---

## What is Anamnesis?

Medical records store information. **Anamnesis remembers the patient.**

A patient's history is scattered across blood reports, prescriptions, discharge summaries, and imaging. Every visit starts with a doctor reconstructing the past instead of treating the present. Anamnesis turns that pile of documents into a living, connected clinical memory: upload a report, and it becomes part of a knowledge graph that links diagnoses, medications, labs, and visits together, growing more useful with every new fact.

It's built on top of **[Cognee](https://github.com/topoteretes/cognee)**'s four memory primitives, self-hosted end-to-end so patient data never leaves infrastructure we control:

| Operation | What it does in Anamnesis |
|---|---|
| **Remember** | Ingests a document (PDF, scanned prescription, report), extracts structured medical entities via vision-based OCR, and commits them to the patient's memory graph. |
| **Recall** | Answers a clinician's question by retrieving connected clinical context — not by searching documents. |
| **Improve** | Re-processes the graph as new information arrives, strengthening and correcting relationships between facts. |
| **Forget** | Intelligently retires duplicate, resolved, or obsolete information while preserving the historical record. |

Every one of these operations is visible in the app's live operations panel. Anamnesis is designed *through* Cognee, not around it.

**Live app:** [anamnesisai.vercel.app](https://anamnesisai.vercel.app)

---

## Key Features

Beyond its core memory engine, Anamnesis implements a full suite of clinical tools mapping directly to its page routes:

### 1. Unified Patient Dashboard (`/dashboard`)
*   **Patient Overview Card**: Real-time status summarizing active diagnoses, current medications, last recorded visit, upcoming appointments, and fully manageable allergy lists (add/remove).
*   **Clinical Timeline**: A chronological history of all clinical events (diagnoses, medications, visits, and uploaded documents).
*   **Live Interactive Memory Graph**: A dynamic SVG visualization of the patient's Cognee knowledge graph showing active nodes (entities) and edges (relationships) that grows in real-time.
*   **Clinical History Archive**: Preserves ruled-out conditions and discontinued medications with dates and custom clinician notes, keeping the active view clean without losing the medical history.

### 2. Fact Correction & Feedback
*   **Actionable Roster**: Clinicians can mark conditions as "ruled out" or medications as "discontinued" directly from the dashboard, attaching an optional note.
*   **Graph Corrections**: Submitting corrections executes Cognee's `improve` pipeline, restructuring graph facts to reflect the clinical correction.

### 3. Document Ingestion & Vision OCR (`/remember`)
*   **Multi-Format Uploads**: Support for PDFs and image files across clinical categories (Blood reports, Prescriptions, Discharge summaries, Imaging reports).
*   **Gemini Vision OCR**: Extracts structured clinical entities (diagnoses, medications, and precise lab test values with units) in a single step.
*   **Intelligent Deduplication**: When a document of the same type and date is uploaded, Anamnesis triggers Cognee's `forget` routine to replace/merge the duplicate document to avoid duplicate entities.

### 4. Graph Recall Assistant (`/assistant`)
*   **Natural Language Querying**: Asks questions directly to the patient's graph database using Cognee semantic recall.
*   **Traceable Evidence Chains**: Answers are returned with step-by-step trace nodes from the knowledge graph, showing the exact source snippet, document type, and document date.
*   **Suggested Questions**: One-click preset queries (e.g., *“Why is kidney function declining?”*, *“What changed since the previous consultation?”*) to speed up clinical review.

### 5. Multi-Tenant Onboarding (`/onboarding`)
*   **Clerk Organizations Integration**: Scopes all clinician users, patient rosters, audit logs, and Cognee dataset memory securely to an organization/clinic.

### 6. Built-in Connectivity Diagnostics (`/debug`)
*   **Cognee Health Checks**: Verification tool for developers to test local or remote Cognee connectivity.
*   **Sandbox Executions**: Run sandboxed `remember()` and `recall()` operations directly, viewing real-time JSON response payloads from the underlying Cognee engine.

---

## Why this exists

Electronic health records store documents. They don't connect years of scattered medical events into a coherent story, so every consultation begins with a doctor re-reading the past instead of reasoning about it. Anamnesis is a bet that clinical software should behave like a memory, not a filing cabinet: every upload strengthens what's already known, and every question is answered with the full weight of a patient's history behind it.

---

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   Next.js (App Router)  │  HTTPS │   Self-hosted Cognee      │
│   Vercel                │──────▶│   (GCP VM, Docker, TLS)   │
│                          │  API   │                          │
│  · Clerk (auth + orgs)  │  key   │  · Postgres + pgvector   │
│  · Postgres/Neon        │◀──────│    (vector store)         │
│    (tenancy, roster,    │        │  · Kuzu (embedded graph) │
│    audit log)           │        │                          │
│  · Gemini (OCR + LLM)   │        │  remember / recall /     │
└─────────────────────────┘        │  improve / forget         │
                                    └──────────────────────────┘
```

- **Multi-tenant by design**: Clerk Organizations model a clinic; clinicians and patients are scoped to one org, with every API route and Cognee call org-scoped.
- **App state vs. clinical memory**: Postgres holds tenancy state (orgs, clinicians, patient roster, audit log) only. Cognee's graph is the single source of truth for clinical facts and their relationships; the app never builds a shadow copy of it.
- **PHI-aware from day one**: The architecture is built for real patient data (encryption in transit/at rest, tenant isolation, audit logging), but the project only ever uses **synthetic data** until compliance work (signed BAAs, security review, retention/deletion policy) is complete.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend / Backend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Auth & tenancy | Clerk (Organizations) |
| App database | Postgres (Neon/Vercel Postgres) via Drizzle ORM |
| Memory engine | [Cognee](https://github.com/topoteretes/cognee), self-hosted (Docker locally, GCP in production) |
| Vector store | Postgres + pgvector |
| Graph store | Kuzu (embedded, per-dataset isolation) |
| LLM / OCR | Google Gemini API |
| Hosting | Vercel |
| Observability | Sentry |

---

## Getting started

```bash
git clone https://github.com/Naazimsnh02/Anamnesis.git
cd Anamnesis
npm install
```

Set up the local Cognee stack's env file (LLM/embedding keys, JWT secret):

```bash
cp .env.example .env
# fill in the values
```

Bring up the local Cognee stack:

```bash
docker compose up -d
```

Set up your environment (Clerk keys, Postgres connection string, Cognee URL/key, Gemini key):

```bash
cp .env.local.example .env.local
# fill in the values
```

Push the database schema and start the dev server:

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

```bash
npm run test        # run the test suite (Vitest)
npm run lint         # lint
npm run build        # production build
npm run db:studio    # Drizzle Studio for the Postgres schema
```

---

## Hackathon

Built for **[The Hangover Part AI: Where's My Context?](https://wemakedevs.org/hackathons/cognee)** (wemakedevs.org, June 29 – July 5, 2026). It was submitted to the **Best Use of Open Source** track, built entirely on self-hosted, open-source Cognee.

---

## License

MIT

---

*Claude Code was used as part of the development of this project.*
