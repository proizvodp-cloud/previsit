export interface Question {
  id: string;
  text: string;
  type: "text" | "choice" | "multi_choice" | "number" | "boolean";
  options: string[] | null;
  required: boolean;
}

export interface IntakeInfo {
  session_id: number;
  status: "not_started" | "in_progress" | "completed";
  patient_first_name: string;
  patient_last_name: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string | null;
  scheduled_at: string;
  questions: Question[];
  answers: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
}

export interface CaseData {
  id: number;
  status: "draft" | "ready" | "reviewed";
  patient_first_name: string;
  patient_last_name: string;
  patient_date_of_birth: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
  scheduled_at: string;
  summary: Record<string, string>;
  ai_flags: string[];
  raw_text: string | null;
  doctor_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CaseListItem {
  id: number;
  status: "draft" | "ready" | "reviewed";
  patient_first_name: string;
  patient_last_name: string;
  doctor_first_name: string;
  doctor_last_name: string;
  scheduled_at: string;
  ai_flags_count: number;
  created_at: string;
}

export interface AppointmentListItem {
  id: number;
  invite_token: string;
  status: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string | null;
  patient_phone: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
  scheduled_at: string;
  intake_status: string | null;
  case_id: number | null;
}
