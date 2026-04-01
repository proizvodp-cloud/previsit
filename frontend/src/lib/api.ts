import type { CaseData, IntakeInfo } from "@/types";

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

  getCase: (id: string | number) =>
    request<CaseData>(`/api/cases/${id}`),
};
