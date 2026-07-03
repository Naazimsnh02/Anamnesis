import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";

// Reached when a signed-in clinician has no active Clerk organization —
// src/proxy.ts redirects here. Single clinic/org to start (confirmed
// production scope decision, see CLAUDE.md), so this is deliberately just
// "create or join the one org you belong to," not a multi-org switcher.
export default async function OnboardingPage() {
  const { orgId } = await auth();
  if (orgId) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Anamnesis</p>
          <h1 className="display d-md text-[var(--ink)]">Set up your clinic</h1>
          <p className="lede mt-3 text-sm">
            Create a clinic workspace, or accept an invite if a colleague already set one up.
          </p>
        </div>
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: "var(--pen)",
              fontFamily: "var(--font-sans)",
              borderRadius: "12px",
            },
          }}
        />
        <p className="mono mt-6 text-center text-xs text-[var(--ink-faint)]">
          Once your clinic is set up, invite colleagues anytime from the header menu.
        </p>
      </div>
    </main>
  );
}
