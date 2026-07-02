import { getRoster } from "@/lib/roster";

export async function GET() {
  const roster = await getRoster();
  return Response.json(roster);
}
