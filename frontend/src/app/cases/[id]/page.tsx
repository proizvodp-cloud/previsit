"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { CaseData } from "@/types";

const SUMMARY_LABELS: Record<string, string> = {
  chief_complaint: "Основная жалоба",
  anamnesis_morbi: "История болезни",
  anamnesis_vitae: "Анамнез жизни",
  medications: "Лекарства",
  allergies: "Аллергии",
  lifestyle: "Образ жизни",
  doctor_notes: "Пожелания пациента",
};

function SectionCard({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-gray-800 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

export default function CasePage() {
  const params = useParams();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getCase(id)
      .then(setCaseData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-1">Ошибка загрузки</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!caseData) return null;

  const scheduledDate = new Date(caseData.scheduled_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dob = caseData.patient_date_of_birth
    ? new Date(caseData.patient_date_of_birth).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const statusColor = {
    draft: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
    reviewed: "bg-blue-100 text-blue-700",
  }[caseData.status];

  const statusLabel = {
    draft: "Черновик",
    ready: "Готов",
    reviewed: "Просмотрен",
  }[caseData.status];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {caseData.patient_last_name} {caseData.patient_first_name}
            </h1>
            <p className="text-xs text-gray-400">{scheduledDate}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Patient info */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Пациент
          </p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">ФИО</span>
            <span className="text-gray-800 font-medium">
              {caseData.patient_last_name} {caseData.patient_first_name}
            </span>
            {dob && (
              <>
                <span className="text-gray-500">Дата рождения</span>
                <span className="text-gray-800">{dob}</span>
              </>
            )}
            <span className="text-gray-500">Врач</span>
            <span className="text-gray-800">
              {caseData.doctor_last_name} {caseData.doctor_first_name}
            </span>
          </div>
        </div>

        {/* AI flags */}
        {caseData.ai_flags.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Внимание врача
            </p>
            <ul className="space-y-2">
              {caseData.ai_flags.map((flag, i) => (
                <li key={i} className="text-sm text-red-800 flex gap-2">
                  <span className="text-red-400 flex-shrink-0">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary sections */}
        {Object.entries(SUMMARY_LABELS).map(([key, label]) => (
          <SectionCard
            key={key}
            label={label}
            value={caseData.summary[key]}
          />
        ))}

        {/* Raw text fallback */}
        {Object.keys(caseData.summary).length === 0 && caseData.raw_text && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Текст кейса
            </p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
              {caseData.raw_text}
            </p>
          </div>
        )}

        {/* Doctor notes */}
        {caseData.doctor_notes && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
              Заметки врача
            </p>
            <p className="text-blue-800 text-sm">{caseData.doctor_notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 py-2">
          Кейс создан {new Date(caseData.created_at).toLocaleDateString("ru-RU")}
        </p>
      </div>
    </div>
  );
}
