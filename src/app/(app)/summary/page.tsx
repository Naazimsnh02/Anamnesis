import { redirect } from "next/navigation";

// Folded into /dashboard's Patient Overview section (PRD §10 dashboard work,
// 2026-07-03) — this route stays as a redirect so old links/bookmarks don't 404.
export default function SummaryPage() {
  redirect("/dashboard");
}
