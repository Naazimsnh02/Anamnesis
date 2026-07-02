// Cognee's recall() with includeReferences:true appends an "Evidence:" block
// to the completion text citing the graph chunks it traversed to answer the
// query. This splits that block back out into structured citations so the
// UI can show the evidence chain instead of raw prose.
export type EvidenceItem = {
  dataId: string;
  chunkId: string;
  snippet: string;
  documentType: string | null;
  documentDate: string | null;
};

export type ParsedRecall = {
  answer: string;
  evidence: EvidenceItem[];
};

const EVIDENCE_LINE =
  /^- chunk \d+ of .+? \(data_id: ([a-f0-9-]+), chunk_id: ([a-f0-9-]+)\): "(.*)"$/;
const SNIPPET_TYPE_DATE = /'s ([a-z_ ]+?) dated (\d{4}-\d{2}-\d{2})/i;

export function parseRecallText(text: string): ParsedRecall {
  const marker = "\n\nEvidence:\n";
  const splitAt = text.indexOf(marker);
  if (splitAt === -1) {
    return { answer: text.trim(), evidence: [] };
  }

  const answer = text.slice(0, splitAt).trim();
  const evidenceBlock = text.slice(splitAt + marker.length);
  const evidence: EvidenceItem[] = [];

  for (const line of evidenceBlock.split("\n")) {
    const match = line.match(EVIDENCE_LINE);
    if (!match) continue;
    const [, dataId, chunkId, snippet] = match;
    const typeDate = snippet.match(SNIPPET_TYPE_DATE);
    evidence.push({
      dataId,
      chunkId,
      snippet,
      documentType: typeDate ? typeDate[1].trim() : null,
      documentDate: typeDate ? typeDate[2] : null,
    });
  }

  return { answer, evidence };
}

// Cognee's recall() returns a list of result objects (usually length 1 for
// completion search types). This pulls the first result's text and parses it.
export function parseRecallResponse(body: unknown): ParsedRecall & { source: string | null } {
  const results = Array.isArray(body) ? body : [];
  const first = results[0] as { text?: string; source?: string } | undefined;
  if (!first || typeof first.text !== "string") {
    return { answer: "", evidence: [], source: null };
  }
  const parsed = parseRecallText(first.text);
  return { ...parsed, source: first.source ?? null };
}
