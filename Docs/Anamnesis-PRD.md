# Product Requirements Document (PRD)

# Anamnesis

**Tagline:** Every patient's story. Remembered.

---

## 1. Overview

Anamnesis is a persistent clinical memory platform that transforms fragmented medical records into a living, evolving patient history.

Instead of storing documents, Anamnesis builds a structured medical memory that continuously learns from every consultation, lab report, prescription, discharge summary, and diagnostic report.

Doctors no longer search through PDFs—they explore a patient's complete clinical journey.

The core philosophy is simple:

*«Medical records store information.*

*Anamnesis remembers the patient.»*

---

## 2. Problem Statement

Healthcare data is fragmented.

A patient's medical history is spread across:

- Hospitals
- Clinics
- Laboratories
- Imaging centers
- Prescriptions
- Discharge summaries
- Doctor notes

Every consultation begins with reconstructing history.

Doctors spend valuable time searching instead of diagnosing.

Traditional Electronic Health Records store documents but fail to connect years of medical events into meaningful relationships.

---

## 3. Vision

Build the world's first living clinical memory that evolves with every patient interaction.

Every upload strengthens the patient's memory.

Every consultation benefits from everything that came before.

---

## 4. Core Principles

Anamnesis is built around four memory operations.

**Remember**

Capture every meaningful medical event.

**Recall**

Retrieve connected clinical knowledge rather than searching documents.

**Improve**

Continuously enrich relationships as new information arrives.

**Forget**

Intelligently archive obsolete, duplicate, or resolved information while preserving medical history.

---

## 5. Target Users

**Primary**

- Physicians
- Specialists
- Hospitals
- Clinics

**Secondary**

- Patients
- Caregivers
- Telemedicine providers

---

## 6. Product Workflow

Patient uploads:

- Blood report
- Prescription
- MRI report
- Hospital discharge summary

↓

OCR extracts medical entities

↓

Structured patient memory is created

↓

Knowledge graph expands

↓

Doctor asks questions

↓

Memory evolves after every visit

---

## 7. Core Features

### 7.1 Patient Memory Timeline

A chronological timeline containing:

- Diagnoses
- Symptoms
- Medications
- Laboratory results
- Procedures
- Hospitalizations
- Imaging studies
- Follow-up visits
- Clinical notes

---

### 7.2 Medical Document Import

Supported uploads:

- PDF reports
- Prescription photos
- Lab reports
- Handwritten notes
- Imaging reports
- Discharge summaries

Automatic extraction of structured clinical information.

---

### 7.3 Medical Memory Graph

Instead of isolated documents, every entity becomes connected.

Example:

Patient

↓

Hypertension

↓

Amlodipine

↓

Blood Pressure

↓

Kidney Function

↓

Hospital Admission

Every diagnosis, medication, symptom, and laboratory value becomes part of a connected graph.

---

### 7.4 Smart Clinical Search

Examples:

"Why has kidney function declined?"

"When did hypertension first appear?"

"What changed since the previous visit?"

"Show every episode of hyperkalemia."

"Which medication was started before anemia developed?"

---

### 7.5 Patient Summary

Automatically generated summary including:

- Active conditions
- Current medications
- Allergies
- Recent investigations
- Recent admissions
- Outstanding follow-ups
- Important clinical observations

---

### 7.6 Laboratory Trends

Visualize longitudinal trends for:

- Creatinine
- eGFR
- HbA1c
- Potassium
- Sodium
- Hemoglobin
- Cholesterol
- Liver function
- Thyroid markers

---

### 7.7 Medication History

Track:

- Current medications
- Historical medications
- Dosage changes
- Start dates
- Stop dates
- Side effects
- Medication adherence

---

### 7.8 Relationship Explorer

Interactive graph connecting:

- Diseases
- Symptoms
- Medications
- Procedures
- Laboratory values
- Hospital admissions

Selecting any node highlights related clinical events.

---

### 7.9 Visit Preparation

Before every appointment generate:

- Patient overview
- Changes since last visit
- New medications
- Abnormal laboratory trends
- Pending investigations
- Suggested discussion topics

---

## 8. Memory Operations

### Remember()

Every uploaded document becomes structured memory.

Examples:

- Blood reports
- Prescriptions
- Doctor notes
- Imaging
- Wearables
- Patient journals

Each upload creates or updates entities within the patient graph.

Example:

Patient

↓

Diabetes

↓

Metformin

↓

HbA1c

↓

7.8%

↓

January 2025

Nothing is simply stored as a PDF.

Everything becomes searchable knowledge.

---

### Recall()

Doctors retrieve connected clinical reasoning rather than document search.

Example query:

"Why is kidney function worsening?"

Instead of returning documents, Anamnesis traverses the graph.

Example reasoning:

Creatinine increasing

↓

eGFR declining

↓

Persistent hypertension

↓

Medication non-adherence

↓

Repeated dehydration

↓

Hospital admissions

The response explains the clinical journey using connected evidence.

---

### Improve()

The patient memory continuously evolves.

**Example 1**

January:

Elevated glucose detected.

Three months later:

Diabetes diagnosed.

Anamnesis links historical glucose abnormalities to the later diagnosis, enriching earlier records with new context.

**Example 2**

Medication started.

Later:

Patient reports nausea.

Medication discontinued.

The system connects these events into a likely medication side-effect timeline.

**Example 3**

Clinicians repeatedly correct extracted entities.

Future document extraction becomes more accurate and consistent.

Memory grows richer over time rather than remaining static.

---

### Forget()

Medical memory should remain accurate and relevant.

Examples:

- Duplicate reports are merged.
- OCR mistakes are replaced with corrected information.
- Temporary diagnoses marked as ruled out are removed from active conditions while remaining in historical records.
- Discontinued medications move to Medication History.
- Resolved symptoms no longer appear in current clinical summaries.

Nothing important is lost, but outdated information no longer clutters the present.

---

## 9. Sample Questions

Why is kidney function declining?

When was diabetes first diagnosed?

What changed since the previous consultation?

Which medications caused adverse reactions?

Show all hospital admissions.

Has blood pressure improved over two years?

Which laboratory values have remained abnormal?

What investigations are still pending?

---

## 10. Dashboard

**Patient Overview**

- Active Conditions
- Current Medications
- Allergies
- Latest Labs
- Last Visit
- Upcoming Appointment

---

**Timeline**

Complete chronological medical history.

---

**Medical Memory Graph**

Interactive relationship explorer.

---

**Laboratory Trends**

Historical charts with reference ranges.

---

**Documents**

Original uploaded records with extracted structured entities.

---

**AI Assistant**

Natural language interface for clinical questions powered by the persistent memory graph.

---

## 11. Technical Architecture

**Frontend**

- Next.js
- React
- Tailwind CSS
- TypeScript
- Hosting: Vercel (free tier)

**Backend**

- Next.js API routes (serverless, deployed on Vercel)
- No separate backend service required

**Memory Engine**

- Cognee (self-hosted, open-source) — deployed on infrastructure we control, not Cognee Cloud
- Handles graph + vector storage, entity extraction, and relationship resolution
- Chosen deliberately over the managed cloud offering: patient records (PHI) never leave our own infrastructure, which is a hard requirement for realistic hospital/clinic adoption
- Backing stores: local Postgres + pgvector (vector) and a self-hosted graph store (per Cognee OSS backend support) — no third-party data egress

**LLM**

- Google Gemini API (free tier via AI Studio) or Groq (free tier)
- Used for Cognee's cognify pipeline and clinical Q&A reasoning

**OCR / Document Parsing**

- Gemini vision endpoint (same free API key) used directly on uploaded images/PDFs
- No dedicated OCR service required

**Storage**

- Self-hosted Cognee instance (owns ingested/processed data end-to-end)
- No third-party managed storage in the patient-data path

**Authentication**

- Clerk (free tier — up to 10,000 MAU, no card required)

---

## 12. Hackathon MVP

**Remember**

- Upload PDFs and prescription images.
- Extract structured medical entities.
- Build a patient memory graph.

**Recall**

- Ask complex clinical questions.
- Generate evidence-based responses using the graph.

**Improve**

- Upload new reports.
- Automatically enrich previous diagnoses and relationships.
- Show the graph evolving live.

**Forget**

- Merge duplicate records.
- Mark diagnoses as ruled out.
- Archive discontinued medications.
- Correct OCR mistakes.
- Update summaries automatically.

---

## 13. Demo Flow

1. Upload three years of patient records.
2. Watch the patient memory graph build itself.
3. Ask: "Why is kidney function declining?"
4. Display the evidence chain across diagnoses, medications, labs, and hospitalizations.
5. Upload a new nephrologist report.
6. Watch the graph update automatically.
7. Ask the same question again and show the richer answer.
8. Mark a medication as discontinued and a diagnosis as ruled out.
9. Show how the active summary changes while preserving historical records.

---

## 14. Success Metrics

- Patient summary generated in under 10 seconds.
- Retrieval across years of records in under 5 seconds.
- Automatic entity linking accuracy above 90%.
- Duplicate document detection.
- Timeline updates after every upload.
- Memory graph evolves without manual intervention.

---

## 15. Future Roadmap

**Phase 2**

- FHIR and EHR integration
- Wearable device support
- Multi-hospital record synchronization
- Secure clinician collaboration

**Phase 3**

- Population health analytics
- Family health memory
- Longitudinal disease progression models
- Clinical trial matching
- Multi-patient cohort comparison

---

## Why Anamnesis Wins

Most healthcare AI tools answer questions from documents.

Anamnesis remembers the patient.

Its key innovation is a persistent clinical memory that continuously remembers new information, recalls connected medical history, improves its understanding as evidence accumulates, and intelligently forgets obsolete or resolved information. The result is a living patient memory that grows more useful with every interaction.

Because Anamnesis runs on self-hosted, open-source Cognee, patient data never leaves infrastructure the hospital or clinic controls. For a domain where data sovereignty and compliance are non-negotiable, this is not a deployment detail — it is a core part of why Anamnesis is trustworthy enough to actually adopt.

---

## Hackathon Context

Built for the **"The Hangover Part AI: Where's My Context?"** hackathon (wemakedevs.org/hackathons/cognee), June 29 – July 5, 2026.

- **Target track:** Best Use of Open Source (self-hosted Cognee). Chosen deliberately over Cognee Cloud because data sovereignty is a genuine clinical requirement, not just a track-eligibility choice.
- **Judging weights "Best Use of Cognee" heavily** — the demo must make Cognee's `remember()/recall()/improve()(memify)/forget()` calls visible (e.g., a live operations log) rather than hiding them behind the product UI.
- **Scope discipline:** the hackathon build targets Section 12 (Hackathon MVP) and Section 13 (Demo Flow) only. Everything else in this PRD (Sections 7.6–7.9, 10, 15) is roadmap, not hackathon scope.
