"use client";

import { useCallback, useEffect, useState } from "react";

export type PatientSummary = {
  id: string;
  name: string;
  dob: string;
  datasetName: string;
};

export function useActivePatient() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients ?? []);
        setActivePatientId(data.activePatientId ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    refresh();
  }, [refresh]);

  async function switchPatient(patientId: string) {
    const res = await fetch("/api/patients/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    });
    if (res.ok) {
      // Every app page resolves the active patient server-side per request
      // (cookie), and each page's own data (uploads, recall history, roster)
      // is client-fetched on mount with no cross-page shared state — a full
      // reload is the simplest way to guarantee everything re-resolves
      // against the newly selected patient, and switching patients is rare
      // enough that this doesn't need to be instant.
      window.location.reload();
    }
    return res.ok;
  }

  const activePatient = patients.find((p) => p.id === activePatientId) ?? null;

  return { patients, activePatientId, activePatient, loading, refresh, switchPatient };
}
