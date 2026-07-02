/* Landing-page content. Kept apart from layout so copy stays reviewable. */

export const NAV = [
  { label: "The problem", href: "#problem" },
  { label: "How it works", href: "#how" },
  { label: "Memory", href: "#memory" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
] as const;

/** The four Cognee memory operations — the conceptual spine of the product. */
export const OPERATIONS = [
  {
    verb: "remember",
    signature: "remember(document)",
    title: "Every record becomes structured memory",
    body: "Upload a blood report, a prescription, a discharge summary. Anamnesis reads it, pulls out the diagnoses, medications, lab values and dates, and writes them into the patient's graph — not as another PDF, but as connected knowledge.",
    node: "HbA1c 7.8% · Jan 2025",
  },
  {
    verb: "recall",
    signature: "recall(question)",
    title: "Ask the history, not the filing cabinet",
    body: "Instead of searching documents, ask a question. Anamnesis traverses years of connected events and returns a reasoned answer with the evidence chain attached — the labs, medications and admissions it walked to get there.",
    node: "Why is kidney function declining?",
  },
  {
    verb: "improve",
    signature: "improve(new evidence)",
    title: "The record grows richer as evidence arrives",
    body: "A glucose reading from last spring gains meaning when this winter's diabetes diagnosis lands. New reports don't just append — they reach back and enrich what was already remembered.",
    node: "glucose ↦ diabetes",
  },
  {
    verb: "forget",
    signature: "forget(ruled-out)",
    title: "Forgetting, without losing the record",
    body: "Mark a diagnosis ruled out or a medication discontinued and it leaves the active summary immediately — while staying fully recoverable in the historical record. The present stays clean; nothing is destroyed.",
    node: "amlodipine → history",
  },
] as const;

export const FEATURES = [
  {
    k: "Timeline",
    title: "A single patient timeline",
    body: "Diagnoses, labs, medications, procedures and admissions in one chronological thread — assembled from the graph, never hand-maintained.",
  },
  {
    k: "Graph",
    title: "A connected memory graph",
    body: "Patient → Hypertension → Amlodipine → Blood pressure → Kidney function. Every entity is a node; every relationship is traversable.",
  },
  {
    k: "Search",
    title: "Reasoning, with evidence",
    body: "Answers arrive with the nodes and edges they were drawn from, so a clinician can see why — not just what.",
  },
  {
    k: "Summary",
    title: "A summary that stays current",
    body: "Active conditions, current medications, allergies and recent labs — derived live from memory state, so it's never stale.",
  },
] as const;

export const HOW = [
  {
    step: "01",
    title: "Import",
    body: "Drop in years of records — PDFs, prescription photos, imaging reports. Gemini vision extracts the structured clinical entities from each one.",
  },
  {
    step: "02",
    title: "Remember",
    body: "Every entity is written into the patient's memory graph through Cognee's remember() — building the connections between conditions, drugs and results.",
  },
  {
    step: "03",
    title: "Recall",
    body: "Ask a question in plain language. Cognee's recall() walks the graph; Gemini reasons over what it finds and returns an evidence-linked answer.",
  },
  {
    step: "04",
    title: "Evolve",
    body: "Each new upload triggers improve(), enriching prior records. Ruled-out findings are forgotten from the active view — the memory keeps sharpening.",
  },
] as const;

export const ADVANTAGES = [
  {
    title: "Memory, not document search",
    body: "Most clinical AI retrieves passages from files. Anamnesis holds a connected model of the patient and reasons across it.",
  },
  {
    title: "Data never leaves your walls",
    body: "Built on self-hosted, open-source Cognee — Postgres, pgvector and Neo4j on infrastructure you control. No patient record touches a managed cloud.",
  },
  {
    title: "The reasoning is inspectable",
    body: "Every remember, recall, improve and forget is a visible operation, with the evidence chain shown — not a black box.",
  },
  {
    title: "It compounds",
    body: "Every upload makes every future consultation better. The record is an asset that appreciates, not a folder that grows.",
  },
] as const;

export const ROADMAP: {
  when: string;
  title: string;
  body: string;
  live?: boolean;
}[] = [
  { when: "Now", title: "Living clinical memory", body: "Remember, recall, improve and forget across a patient's full history, with a visible memory graph.", live: true },
  { when: "Next", title: "FHIR & EHR integration", body: "Ingest directly from existing hospital systems instead of one document at a time." },
  { when: "Next", title: "Clinician collaboration", body: "Shared, permissioned memory across a care team, with attribution on every correction." },
  { when: "Later", title: "Population memory", body: "Cohort comparison and longitudinal disease-progression models built on connected histories." },
] as const;

export const FAQ = [
  {
    q: "Is this just an EHR with a chatbot?",
    a: "No. An EHR stores documents and lets you search them. Anamnesis builds a connected memory of the patient — a graph of conditions, medications, labs and events — and reasons across it. The chat is one way in; the memory is the product.",
  },
  {
    q: "Where does patient data live?",
    a: "On infrastructure you control. Anamnesis runs on self-hosted, open-source Cognee with Postgres, pgvector and Neo4j as backing stores. No patient record is sent to a managed third-party data store. Data sovereignty is a requirement, not a setting.",
  },
  {
    q: "How does it read a scanned prescription or PDF?",
    a: "Uploaded documents pass through Gemini vision, which extracts structured clinical entities — diagnosis, medication, dose, lab value, date. Those entities, not the raw file, become the memory.",
  },
  {
    q: "What happens when information is wrong or outdated?",
    a: "You correct or retire it. A ruled-out diagnosis or discontinued medication is forgotten from the active summary while remaining in the historical record — recoverable, auditable, never silently deleted.",
  },
  {
    q: "Why build on Cognee specifically?",
    a: "Cognee gives us the four memory operations — remember, recall, improve, forget — over a real graph-plus-vector store, as open source we can self-host. That combination is exactly what a persistent clinical memory needs, and it keeps the whole patient-data path inside our own walls.",
  },
] as const;
