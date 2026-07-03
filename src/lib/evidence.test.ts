import { describe, expect, it } from "vitest";
import { parseRecallResponse, parseRecallText } from "./evidence";

describe("parseRecallText", () => {
  it("returns the whole text as the answer when there is no Evidence block", () => {
    const result = parseRecallText("Kidney function is declining.");
    expect(result).toEqual({ answer: "Kidney function is declining.", evidence: [] });
  });

  it("splits answer from a well-formed Evidence block and parses each citation", () => {
    const text =
      "Kidney function is declining based on eGFR trends.\n\n" +
      "Evidence:\n" +
      '- chunk 1 of blood_report.pdf (data_id: 11111111-1111-1111-1111-111111111111, chunk_id: 22222222-2222-2222-2222-222222222222): "Patient\'s blood report dated 2024-03-01"\n' +
      '- chunk 2 of nephrology_note.pdf (data_id: 33333333-3333-3333-3333-333333333333, chunk_id: 44444444-4444-4444-4444-444444444444): "Patient\'s nephrology note dated 2024-06-15"';

    const result = parseRecallText(text);

    expect(result.answer).toBe("Kidney function is declining based on eGFR trends.");
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence[0]).toEqual({
      dataId: "11111111-1111-1111-1111-111111111111",
      chunkId: "22222222-2222-2222-2222-222222222222",
      snippet: "Patient's blood report dated 2024-03-01",
      documentType: "blood report",
      documentDate: "2024-03-01",
    });
    expect(result.evidence[1].documentType).toBe("nephrology note");
    expect(result.evidence[1].documentDate).toBe("2024-06-15");
  });

  it("skips lines in the Evidence block that don't match the expected citation format", () => {
    const text =
      "Answer text.\n\n" +
      "Evidence:\n" +
      "this is not a valid citation line\n" +
      '- chunk 1 of report.pdf (data_id: 11111111-1111-1111-1111-111111111111, chunk_id: 22222222-2222-2222-2222-222222222222): "no type/date pattern here"';

    const result = parseRecallText(text);

    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].documentType).toBeNull();
    expect(result.evidence[0].documentDate).toBeNull();
  });

  it("trims surrounding whitespace on the answer", () => {
    const result = parseRecallText("  \n  Answer with padding.  \n\n  ");
    expect(result.answer).toBe("Answer with padding.");
  });
});

describe("parseRecallResponse", () => {
  it("parses the first result's text field and preserves its source", () => {
    const body = [{ text: "Answer only, no evidence.", source: "graph_completion" }];
    const result = parseRecallResponse(body);
    expect(result.answer).toBe("Answer only, no evidence.");
    expect(result.evidence).toEqual([]);
    expect(result.source).toBe("graph_completion");
  });

  it("returns empty answer/evidence and null source when body is not an array", () => {
    expect(parseRecallResponse({ text: "not an array" })).toEqual({
      answer: "",
      evidence: [],
      source: null,
    });
    expect(parseRecallResponse(null)).toEqual({ answer: "", evidence: [], source: null });
  });

  it("returns empty answer/evidence when the array is empty or the first item has no text", () => {
    expect(parseRecallResponse([])).toEqual({ answer: "", evidence: [], source: null });
    expect(parseRecallResponse([{ source: "x" }])).toEqual({
      answer: "",
      evidence: [],
      source: null,
    });
  });

  it("defaults source to null when absent", () => {
    const result = parseRecallResponse([{ text: "Answer." }]);
    expect(result.source).toBeNull();
  });
});
