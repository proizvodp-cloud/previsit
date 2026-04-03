import type { AppointmentListItem, CaseData, CaseListItem, IntakeInfo } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// Token helpers (client-side only)
export const auth = {
  getToken: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
  setToken: (token: string) => localStorage.setItem("auth_token", token),
  clear: () => localStorage.removeItem("auth_token"),
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    auth.clear();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Сессия истекла. Войдите снова.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // --- Auth ---
  login: async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? "Неверный email или пароль");
    }
    return res.json() as Promise<{
      access_token: string;
      token_type: string;
      doctor_id: number;
      doctor_name: string;
    }>;
  },

  // --- Intake (без авторизации — доступ по токену) ---
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

  // --- Patients ---
  updatePatient: (patientId: number, data: { first_name: string; last_name: string; phone: string; email: string }) =>
    request<{ id: number; first_name: string; last_name: string; phone: string | null; email: string | null }>(
      `/api/patients/${patientId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    ),
};
