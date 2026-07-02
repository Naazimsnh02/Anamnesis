import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { requireOrgContext } from "@/lib/db/queries";

// Shared gate for every org-scoped app page (/remember, /assistant,
// /summary). src/proxy.ts already redirects signed-in-but-orgless users to
// /onboarding, but that check happens on the edge/middleware layer without
// DB access — this layout is where the org/clinician rows actually get
// lazily synced into Postgres (see requireOrgContext()'s comment), so every
// page under this group can assume an org+clinician row already exists.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgId } = await auth();
  if (!orgId) redirect("/onboarding");

  await requireOrgContext();

  return (
    <div className="min-h-screen">
      <AppHeader />
      {children}
    </div>
  );
}
