import "server-only";
import { eq, and } from "drizzle-orm";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { orgs, clinicians, patients } from "@/lib/db/schema";

export type AuthContext = {
  clerkUserId: string;
  clerkOrgId: string;
  orgId: string;
  clinicianId: string;
  role: "admin" | "physician" | "staff";
};

// Clerk Organizations has no webhook receiver wired up yet (that's a Phase 6
// hardening item — see Docs/Implementation-Plan.md), so org/clinician rows
// are lazily upserted on demand instead of kept in sync via events. Cheap
// (single upsert query) and correct as long as this runs on every
// authenticated request that touches org/patient data, which requireOrgContext()
// guarantees by being the one entry point every (app) route uses.
export async function requireOrgContext(): Promise<AuthContext> {
  const { userId, orgId: clerkOrgId, orgRole } = await auth();
  if (!userId || !clerkOrgId) {
    throw new Error("requireOrgContext() called without an active Clerk user+org session");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email || userId;

  const clerk = await clerkClient();
  const orgInfo = await clerk.organizations.getOrganization({ organizationId: clerkOrgId });

  const [org] = await db
    .insert(orgs)
    .values({ clerkOrgId, name: orgInfo.name })
    .onConflictDoUpdate({ target: orgs.clerkOrgId, set: { name: orgInfo.name } })
    .returning();

  // Clerk's built-in roles are "org:admin" / "org:member" (set via the
  // organization_settings API when Organizations was enabled). Map those to
  // this app's role vocabulary; "staff" has no Clerk-role equivalent yet and
  // is only ever set by an in-app admin action (none exists yet — Phase 8).
  const role: AuthContext["role"] = orgRole === "org:admin" ? "admin" : "physician";

  const [clinician] = await db
    .insert(clinicians)
    .values({ orgId: org.id, clerkUserId: userId, name, email, role })
    .onConflictDoUpdate({
      target: [clinicians.orgId, clinicians.clerkUserId],
      set: { name, email, role },
    })
    .returning();

  return { clerkUserId: userId, clerkOrgId, orgId: org.id, clinicianId: clinician.id, role };
}

export async function listPatientsForOrg(orgId: string) {
  return db.select().from(patients).where(eq(patients.orgId, orgId)).orderBy(patients.name);
}

export async function getPatientForOrg(orgId: string, patientId: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.orgId, orgId), eq(patients.id, patientId)))
    .limit(1);
  return patient ?? null;
}
