"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AppointmentListItem, CaseListItem } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────────────────

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

// ─── Patient Edit Modal ───────────────────────────────────────────────────────────

interface PatientForm {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

function PatientEditModal({
  appt,
  onSave,
  onClose,
}: {
  appt: AppointmentListItem;
  onSave: (patientId: number, data: PatientForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PatientForm>({
    first_name: appt.patient_first_name,
    last_name: appt.patient_last_name,
    phone: appt.patient_phone ?? "",
    email: appt.patient_email ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);
    await onSave(appt.patient_id, form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Данные пациента</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Фамилия</label>
            <input
              autoFocus
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Иванов"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Имя</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Иван"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Телефон</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="+7 (999) 000-00-00"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="patient@example.com"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Share helpers ───────────────────────────────────────────────────────────────────────────

const SHARE_ORIGIN = process.env.NEXT_PUBLIC_SHARE_URL || (typeof window !== "undefined" ? window.location.origin : "");

function getIntakeUrl(appt: AppointmentListItem) {
  return `${SHARE_ORIGIN}/intake/${appt.invite_token}`;
}

async function copyIntakeLink(appt: AppointmentListItem) {
  const url = getIntakeUrl(appt);
  await navigator.clipboard.writeText(url);
}

function shareWhatsApp(appt: AppointmentListItem) {
  const phone = appt.patient_phone?.replace(/\D/g, "");
  if (!phone) return;
  const url = getIntakeUrl(appt);
  const msg = `Уважаемый(ая) ${appt.patient_first_name}, ваш приём ${formatDate(appt.scheduled_at)}. Пожалуйста, заполните анкету заранее: ${url}`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function shareTelegram(appt: AppointmentListItem) {
  const url = getIntakeUrl(appt);
  const msg = `Уважаемый(ая) ${appt.patient_first_name}, ваш приём ${formatDate(appt.scheduled_at)}. Пожалуйста, заполните анкету заранее:`;
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}

function shareSMS(appt: AppointmentListItem) {
  if (!appt.patient_phone) return;
  const url = getIntakeUrl(appt);
  const msg = `Уважаемый(ая) ${appt.patient_first_name}, ваш приём ${formatDate(appt.scheduled_at)}. Заполните анкету: ${url}`;
  window.open(`sms:${appt.patient_phone}?body=${encodeURIComponent(msg)}`);
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [editingPatient, setEditingPatient] = useState<AppointmentListItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-dropdown]")) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

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

  async function handleSavePatient(patientId: number, data: PatientForm) {
    try {
      const updated = await api.updatePatient(patientId, data);
      setAppointments((prev) =>
        prev.map((a) =>
          a.patient_id === patientId
            ? {
                ...a,
                patient_first_name: updated.first_name,
                patient_last_name: updated.last_name,
                patient_phone: updated.phone,
                patient_email: updated.email,
              }
            : a
        )
      );
      setEditingPatient(null);
    } catch (e: unknown) {
      alert(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

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
      {/* Patient edit modal */}
      {editingPatient && (
        <PatientEditModal
          appt={editingPatient}
          onSave={handleSavePatient}
          onClose={() => setEditingPatient(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Дашборд</h1>
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900">
                              {appt.patient_last_name} {appt.patient_first_name}
                            </span>
                            <button
                              onClick={() => setEditingPatient(appt)}
                              className="text-gray-300 hover:text-blue-500 transition-colors"
                              title="Редактировать данные пациента"
                            >
                              ✏️
                            </button>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 space-x-2">
                            {appt.patient_phone && <span>{appt.patient_phone}</span>}
                            {appt.patient_email && <span>{appt.patient_email}</span>}
                          </div>
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
                          <div className="relative" data-dropdown>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(
                                  openDropdownId === appt.id ? null : appt.id
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              Отправить ссылку ▾
                            </button>
                            {openDropdownId === appt.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                                <button
                                  onClick={() => {
                                    copyIntakeLink(appt).then(() => {
                                      setCopiedId(appt.id);
                                      setTimeout(() => setCopiedId(null), 2000);
                                    });
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 font-medium"
                                >
                                  {copiedId === appt.id ? "✓ Скопировано!" : "📋 Скопировать ссылку"}
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                {appt.patient_phone && (
                                  <>
                                    <button
                                      onClick={() => { shareWhatsApp(appt); setOpenDropdownId(null); }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
                                    >
                                      📱 WhatsApp
                                    </button>
                                    <button
                                      onClick={() => { shareSMS(appt); setOpenDropdownId(null); }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
                                    >
                                      💬 SMS
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => { shareTelegram(appt); setOpenDropdownId(null); }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
                                >
                                  ✈️ Telegram
                                </button>
                                {appt.patient_email && (
                                  <button
                                    onClick={() => { handleSendInvite(appt); setOpenDropdownId(null); }}
                                    disabled={isSending || isSent}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                                  >
                                    {isSent ? "✓ Email отправлен" : "📧 Email"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
