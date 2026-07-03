export type RawGraphNode = { id: string; label: string; type: string; properties: Record<string, unknown> };
export type RawGraphEdge = { source: string; target: string; label: string };
export type RawGraph = { nodes: RawGraphNode[]; edges: RawGraphEdge[] };

export type ClinicalGraphNode = { id: string; label: string; type: string };
export type ClinicalGraphEdge = { source: string; target: string; label: string };
export type ClinicalGraph = { nodes: ClinicalGraphNode[]; edges: ClinicalGraphEdge[] };

// Cognee's raw dataset graph mixes real clinical entities (Entity,
// EntityType) with document-ingestion plumbing (TextDocument, DocumentChunk,
// TextSummary provenance nodes). Filtering to Entity/EntityType turns it
// into the Patient -> Condition -> Medication -> Lab Value relationship
// graph the PRD describes, instead of a document-pipeline diagram.
const CLINICAL_NODE_TYPES = new Set(["Entity", "EntityType"]);

export function toClinicalGraph(raw: RawGraph): ClinicalGraph {
  // Cognee's raw graph can list the same entity more than once (e.g. it's
  // referenced from multiple document chunks), so dedupe by id before
  // rendering — otherwise React sees duplicate keys for the same node.
  const seen = new Map<string, RawGraphNode>();
  for (const n of raw.nodes) {
    if (CLINICAL_NODE_TYPES.has(n.type) && !seen.has(n.id)) seen.set(n.id, n);
  }
  const nodes = [...seen.values()];
  const edges = raw.edges.filter((e) => seen.has(e.source) && seen.has(e.target));
  return {
    nodes: nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
  };
}
