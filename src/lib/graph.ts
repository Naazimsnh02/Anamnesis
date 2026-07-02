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
  const nodes = raw.nodes.filter((n) => CLINICAL_NODE_TYPES.has(n.type));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = raw.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  return {
    nodes: nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
  };
}
