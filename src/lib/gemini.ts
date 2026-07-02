import { GoogleGenAI, Type } from "@google/genai";

function requireApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY (or LLM_API_KEY) must be set");
  }
  return key;
}

export type ExtractedEntities = {
  documentType: string;
  documentDate: string | null;
  diagnoses: { name: string; status: string | null; date: string | null }[];
  medications: { name: string; dosage: string | null; reason: string | null }[];
  labValues: { test: string; value: string; unit: string | null; date: string | null }[];
  summary: string;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: { type: Type.STRING, description: "e.g. blood_report, prescription, discharge_summary, imaging_report" },
    documentDate: { type: Type.STRING, nullable: true, description: "Primary date on the document, ISO 8601 (YYYY-MM-DD) if determinable" },
    diagnoses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          status: { type: Type.STRING, nullable: true, description: "e.g. active, suspected, ruled out, resolved" },
          date: { type: Type.STRING, nullable: true },
        },
        required: ["name"],
      },
    },
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING, nullable: true },
          reason: { type: Type.STRING, nullable: true },
        },
        required: ["name"],
      },
    },
    labValues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          test: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING, nullable: true },
          date: { type: Type.STRING, nullable: true },
        },
        required: ["test", "value"],
      },
    },
    summary: { type: Type.STRING, description: "1-2 sentence plain-language clinical summary of this document" },
  },
  required: ["documentType", "diagnoses", "medications", "labValues", "summary"],
};

const EXTRACTION_PROMPT = `You are a clinical document extraction assistant. Read the attached medical
document (blood report, prescription, discharge summary, or imaging report) and extract
structured entities: diagnoses, medications, lab values, and the document's date.
Only extract what is actually present in the document. Use ISO 8601 (YYYY-MM-DD) dates
where a date is given; use null where not determinable. This is synthetic/demo data,
not real patient information.`;

export async function extractEntitiesFromDocument(
  fileBuffer: Buffer,
  mimeType: string,
  documentTypeHint?: string
): Promise<ExtractedEntities> {
  const ai = new GoogleGenAI({ apiKey: requireApiKey() });
  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  const prompt = documentTypeHint
    ? `${EXTRACTION_PROMPT}\n\nThe uploader labeled this document as: ${documentTypeHint}.`
    : EXTRACTION_PROMPT;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: fileBuffer.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no extraction output");
  }
  return JSON.parse(text) as ExtractedEntities;
}
