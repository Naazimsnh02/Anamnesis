import { put } from "@vercel/blob";

// Stores the original uploaded document (PDF/image) so Phase 5's Documents
// view can show it alongside the entities Cognee extracted from it. Cognee
// itself only ever receives the extracted text narrative, never the raw file.
export async function storeOriginalDocument(
  file: Buffer,
  filename: string,
  contentType: string
) {
  const blob = await put(filename, file, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}
