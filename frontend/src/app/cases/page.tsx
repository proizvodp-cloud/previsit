"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AppointmentListItem, CaseListItem } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:    { label: "Черновик",   cls: "bg-gray-100 text-gray-600" },
    ready:    { label: "Готов",      cls: "bg-green-100 text-green-700" },
    reviewed: { label: "Просмотрен", cls: "bg-blue-100 text-blue-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function IntakeStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<string, { label: string; cls: string }> = {
    not_started: { label: "Не начата",   cls: "bg-yellow-100 text-yellow-700" },
    in_progress: { label: "В процессе",  cls: "bg-orange-100 text-orange-700" },
    completed:   { label: "Заполнена",   cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([api.getCases(), api.getAppointments()])
      .then(([c, a]) => {
        setCases(c);
        setAppointments(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSendInvite(appt: AppointmentListItem) {
    setSendingId(appt.id);
    try {
      await api.sendInvite(appt.id);
      setSentIds((prev) => new Set(prev).add(appt.id));
    } catch (e: unknown) {
      alert(`Ошибка отправки: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSendingId(null);
    }
  }

  // Appointments without a completed case yet
  const pendingAppointments = appointments.filter(
    (a) => !a.case_id || a.intake_status !== "completed"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-6 max-w-sm w-full text-center">
          <p className="text-red-600 font-medium mb-2">Ошибка загрузки</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Дашборд врача</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {cases.length} кейс{cases.length === 1 ? "" : cases.length < 5 ? "а" : "ов"} ·{" "}
          {pendingAppointments.length} записей ожидают анкету
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {/* ── Pending appointments ── */}
        {pendingAppointments.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              Ожидают заполнения анкеты
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-left">
                    <th className="px-4 py-3 font-medium">Пациент</th>
                    <th className="px-4 py-3 font-medium">Врач</th>
                    <th className="px-4 py-3 font-medium">Дата приёма</th>
                    <th className="px-4 py-3 font-medium">Анкета</th>
                    <th className="px-4 py-3 font-medium">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAppointments.map((appt) => {
                    const isSent = sentIds.has(appt.id);
                    const isSending = sendingId === appt.id;
                    return (
                      <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {appt.patient_last_name} {appt.patient_first_name}
                          </div>
                          {appt.patient_email && (
                            <div className="text-xs text-gray-400">{appt.patient_email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {appt.doctor_last_name} {appt.doctor_first_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(appt.scheduled_at)}
                        </td>
                        <td className="px-4 py-3">
                          <IntakeStatusBadge status={appt.intake_status} />
                        </td>
                        <td className="px-4 py-3">
                          {appt.patient_email ? (
                            <button
                              onClick={() => handleSendInvite(appt)}
                              disabled={isSending || isSent}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSent
                                  ? "bg-green-100 text-green-700 cursor-default"
                                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              }`}
                            >
                              {isSending ? "Отправка..." : isSent ? "✓ Отправлено" : "Отправить ссылку"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Нет email</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Cases ── */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Готовые кейсы
          </h2>

          {cases.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
              Кейсов пока нет. Пациенты ещё не заполнили анкеты.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-left">
                    <th className="px-4 py-3 font-medium">Пациент</th>
                    <th className="px-4 py-3 font-medium">Врач</th>
                    <th className="px-4 py-3 font-medium">Приём</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Флаги AI</th>
                    <th className="px-4 py-3 font-medium">Создан</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {c.patient_last_name} {c.patient_first_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.doctor_last_name} {c.doctor_first_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(c.scheduled_at)}
                      </td>
                      <td className="px-4 py-3">
                        <CaseStatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        {c.ai_flags_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            ⚠ {c.ai_flags_count}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/cases/${c.id}`}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Открыть →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
