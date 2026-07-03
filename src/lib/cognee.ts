const COGNEE_API_URL = process.env.COGNEE_API_URL;
const COGNEE_API_KEY = process.env.COGNEE_API_KEY;

function requireConfig() {
  if (!COGNEE_API_URL || !COGNEE_API_KEY) {
    throw new Error(
      "COGNEE_API_URL and COGNEE_API_KEY must be set (see deploy/gcp/CREDENTIALS.md)"
    );
  }
  return { url: COGNEE_API_URL, key: COGNEE_API_KEY };
}

export async function cogneeHealth() {
  const { url } = requireConfig();
  const res = await fetch(`${url}/health`, { cache: "no-store" });
  return { status: res.status, body: await res.json() };
}

export async function cogneeRemember(text: string, datasetName: string) {
  const { url, key } = requireConfig();
  const form = new FormData();
  form.append("data", new Blob([text], { type: "text/plain" }), "note.txt");
  form.append("datasetName", datasetName);

  const res = await fetch(`${url}/api/v1/remember`, {
    method: "POST",
    headers: { "X-Api-Key": key },
    body: form,
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}

export async function cogneeRecall(
  query: string,
  datasetName: string,
  options?: { includeReferences?: boolean; searchType?: string; topK?: number }
) {
  const { url, key } = requireConfig();
  // RecallPayloadDTO takes `datasets` (an array of names) — NOT `datasetName`
  // like remember()/improve()/forget() do (confirmed against the live
  // instance's /openapi.json). Sending `datasetName` here was silently
  // ignored by Cognee (unknown field), so `datasets` defaulted to null —
  // "search all datasets you have read access to" — meaning every recall()
  // call was searching across every patient's dataset on the instance, not
  // just the intended one. Caught via a live cross-patient isolation test
  // once a second patient existed to reveal it (see Docs/progress.md).
  const res = await fetch(`${url}/api/v1/recall`, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      datasets: [datasetName],
      includeReferences: options?.includeReferences ?? false,
      ...(options?.searchType ? { searchType: options.searchType } : {}),
      ...(options?.topK ? { topK: options.topK } : {}),
    }),
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}

// Re-runs Cognee's enrichment pipeline over the dataset's existing graph (no
// new data passed in) so newly-remembered entities get linked into prior
// history — e.g. an early lab value entity linked forward to a later
// diagnosis entity (PRD §8 Improve examples).
export async function cogneeImprove(datasetName: string) {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/api/v1/improve`, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ datasetName }),
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}

// Cognee's forget() is document/dataset-scoped, not entity-scoped (confirmed
// against the live instance's OpenAPI spec) — it removes a whole data item
// (dataId) or a whole dataset, never a single fact within the graph. Used
// here for duplicate-document merges and full-document replacement; see
// src/lib/roster.ts for how per-entity status (ruled out / discontinued) is
// tracked instead.
export async function cogneeForget(params: {
  dataId?: string;
  dataset?: string;
  memoryOnly?: boolean;
}) {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/api/v1/forget`, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}

// remember()'s response `items` array lists every item in the dataset so
// far, not just the one just added, and its order is not reliably
// newest-first or newest-last (confirmed against the live instance: the
// newly-created id has shown up at either end across repeated calls). So the
// only reliable way to identify the item just created is to list the
// dataset's data and take the one with the latest createdAt.
export async function cogneeGetLatestDataId(datasetName: string): Promise<string | null> {
  const { url, key } = requireConfig();
  const dsRes = await fetch(`${url}/api/v1/datasets`, {
    headers: { "X-Api-Key": key },
    cache: "no-store",
  });
  const datasets = (await dsRes.json()) as { id?: string; name?: string }[];
  const dataset = Array.isArray(datasets) ? datasets.find((d) => d.name === datasetName) : null;
  if (!dataset?.id) return null;

  const dataRes = await fetch(`${url}/api/v1/datasets/${dataset.id}/data`, {
    headers: { "X-Api-Key": key },
    cache: "no-store",
  });
  const items = (await dataRes.json()) as { id: string; createdAt: string }[];
  if (!Array.isArray(items) || items.length === 0) return null;

  return items.reduce((latest, item) => (item.createdAt > latest.createdAt ? item : latest)).id;
}

export async function cogneeListDatasets() {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/api/v1/datasets`, {
    headers: { "X-Api-Key": key },
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}

export async function cogneeGetGraph(datasetId: string) {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/api/v1/datasets/${datasetId}/graph`, {
    headers: { "X-Api-Key": key },
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}
