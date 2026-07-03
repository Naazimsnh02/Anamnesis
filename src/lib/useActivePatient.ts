"use client";

import useSWR, { useSWRConfig } from "swr";

export type PatientSummary = {
  id: string;
  name: string;
  dob: string;
  datasetName: string;
};

type PatientsResponse = {
  patients: PatientSummary[];
  activePatientId: string | null;
};

export function useActivePatient() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR<PatientsResponse>("/api/patients");

  const patients = data?.patients ?? [];
  const activePatientId = data?.activePatientId ?? null;
  const activePatient = patients.find((p) => p.id === activePatientId) ?? null;

  // Revalidates every SWR key currently in the cache — used after any action
  // that changes which patient is active (switch, add, seed), since graph,
  // roster, etc. are all scoped to the active patient server-side (cookie).
  async function refreshAll() {
    await globalMutate(() => true);
  }

  async function switchPatient(patientId: string) {
    const res = await fetch("/api/patients/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    });
    if (res.ok) {
      await refreshAll();
    }
    return res.ok;
  }

  return {
    patients,
    activePatientId,
    activePatient,
    loading: isLoading,
    error: error ? error.message : null,
    refresh: () => mutate(),
    refreshAll,
    switchPatient,
  };
}
