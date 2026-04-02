import type { AppointmentListItem, CaseData, CaseListItem, IntakeInfo } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // --- Intake ---
  getIntake: (token: string) =>
    request<IntakeInfo>(`/api/intake/${token}`),

  startIntake: (token: string) =>
    request<{ session_id: number; status: string }>(`/api/intake/${token}/start`, {
      method: "POST",
    }),

  saveAnswer: (token: string, question_id: string, answer: unknown) =>
    request(`/api/intake/${token}/answer`, {
      method: "POST",
      body: JSON.stringify({ question_id, answer }),
    }),

  completeIntake: (token: string) =>
    request<{ case_id: number; status: string }>(`/api/intake/${token}/complete`, {
      method: "POST",
    }),

  // --- Cases ---
  getCases: () =>
    request<CaseListItem[]>(`/api/cases`),

  getCase: (id: string | number) =>
    request<CaseData>(`/api/cases/${id}`),

  reviewCase: (id: number, doctor_notes?: string) =>
    request<{ id: number; status: string }>(`/api/cases/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ doctor_notes: doctor_notes ?? null }),
    }),

  // --- Appointments ---
  getAppointments: () =>
    request<AppointmentListItem[]>(`/api/appointments`),

  sendInvite: (appointmentId: number) =>
    request<{ status: string; to: string }>(`/api/appointments/${appointmentId}/send-invite`, {
      method: "POST",
    }),
};
