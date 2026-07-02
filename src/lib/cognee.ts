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

export async function cogneeRecall(query: string, datasetName: string) {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/api/v1/recall`, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ query, datasetName }),
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}
