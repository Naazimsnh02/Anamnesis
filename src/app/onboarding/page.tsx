import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";

// Reached when a signed-in clinician has no active Clerk organization —
// src/proxy.ts redirects here. Single clinic/org to start (confirmed
// production scope decision, see CLAUDE.md), so this is deliberately just
// "create or join the one org you belong to," not a multi-org switcher.
export default async function OnboardingPage() {
  const { orgId } = await auth();
  if (orgId) redirect("/remember");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Anamnesis</p>
          <h1 className="text-2xl font-medium">Set up your clinic</h1>
          <p className="mt-2 text-sm text-black/60">
            Create a clinic workspace, or accept an invite if a colleague already set one up.
          </p>
        </div>
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/remember"
          afterSelectOrganizationUrl="/remember"
        />
      </div>
    </main>
  );
}
