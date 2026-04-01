"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { IntakeInfo, Question } from "@/types";

// ─── Question input components ────────────────────────────────────────────────

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      className="w-full rounded-xl border border-gray-300 p-4 text-base focus:border-blue-500 focus:outline-none resize-none min-h-[120px]"
      placeholder="Введите ответ..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const num = value === "" ? 0 : Number(value);
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500 px-1">
        <span>0 — нет боли</span>
        <span>10 — невыносимо</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={num}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 accent-blue-600"
      />
      <div className="text-center text-4xl font-bold text-blue-600">{num}</div>
    </div>
  );
}

function ChoiceInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`w-full text-left rounded-xl border-2 px-4 py-3 text-base transition-colors ${
            value === opt
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiChoiceInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`w-full text-left rounded-xl border-2 px-4 py-3 text-base transition-colors flex items-center gap-3 ${
            value.includes(opt)
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-300"
          }`}
        >
          <span
            className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${
              value.includes(opt) ? "border-blue-500 bg-blue-500" : "border-gray-300"
            }`}
          >
            {value.includes(opt) && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

function BooleanInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: "Да", val: "true" },
        { label: "Нет", val: "false" },
      ].map(({ label, val }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`rounded-xl border-2 py-5 text-xl font-semibold transition-colors ${
            value === val
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const str = (value as string) ?? "";
  const arr = (value as string[]) ?? [];

  switch (question.type) {
    case "text":
      return <TextInput value={str} onChange={onChange} />;
    case "number":
      return <NumberInput value={str} onChange={onChange} />;
    case "choice":
      return (
        <ChoiceInput
          options={question.options!}
          value={str}
          onChange={onChange}
        />
      );
    case "multi_choice":
      return (
        <MultiChoiceInput
          options={question.options!}
          value={Array.isArray(value) ? arr : []}
          onChange={onChange}
        />
      );
    case "boolean":
      return <BooleanInput value={str} onChange={onChange} />;
    default:
      return <TextInput value={str} onChange={onChange} />;
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">
        {current} / {total}
      </p>
    </div>
  );
}

// ─── Screen components ────────────────────────────────────────────────────────

function WelcomeScreen({
  info,
  onStart,
  loading,
}: {
  info: IntakeInfo;
  onStart: () => void;
  loading: boolean;
}) {
  const date = new Date(info.scheduled_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Добрый день, {info.patient_first_name}!
      </h1>
      <p className="text-gray-500 mb-1">
        Приём у врача {info.doctor_last_name} {info.doctor_first_name}
      </p>
      <p className="text-gray-400 text-sm mb-8">{date}</p>

      <div className="bg-blue-50 rounded-2xl p-5 mb-8 text-left w-full max-w-sm">
        <p className="text-sm font-medium text-blue-800 mb-2">Что нужно сделать:</p>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex gap-2"><span>✓</span> Ответить на {info.questions.length} вопросов</li>
          <li className="flex gap-2"><span>✓</span> Займёт около 5 минут</li>
          <li className="flex gap-2"><span>✓</span> Врач получит сводку до приёма</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        className="w-full max-w-sm bg-blue-600 text-white rounded-2xl py-4 text-lg font-semibold disabled:opacity-60 hover:bg-blue-700 active:scale-95 transition-all"
      >
        {loading ? "Загрузка..." : "Начать анкету"}
      </button>
    </div>
  );
}

function CompletedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Анкета заполнена!</h1>
      <p className="text-gray-500 max-w-xs">
        Спасибо. Врач получит информацию до вашего приёма. Вы можете закрыть эту страницу.
      </p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Что-то пошло не так</h1>
      <p className="text-gray-500 mb-6 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-blue-700"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
}

// ─── Main intake page ─────────────────────────────────────────────────────────

type AppState = "loading" | "welcome" | "questions" | "submitting" | "done" | "error";

export default function IntakePage() {
  const params = useParams();
  const token = params.token as string;

  const [appState, setAppState] = useState<AppState>("loading");
  const [info, setInfo] = useState<IntakeInfo | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentAnswer, setCurrentAnswer] = useState<unknown>(undefined);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load intake info on mount
  useEffect(() => {
    api.getIntake(token)
      .then((data) => {
        setInfo(data);
        setAnswers(data.answers ?? {});
        if (data.status === "completed") {
          setAppState("done");
        } else if (data.status === "in_progress") {
          // Find first unanswered question
          const firstUnanswered = data.questions.findIndex(
            (q) => !(q.id in data.answers)
          );
          setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
          setCurrentAnswer(data.answers[data.questions[firstUnanswered >= 0 ? firstUnanswered : 0]?.id]);
          setAppState("questions");
        } else {
          setAppState("welcome");
        }
      })
      .catch((e) => {
        setError(e.message);
        setAppState("error");
      });
  }, [token]);

  const handleStart = useCallback(async () => {
    try {
      setSaving(true);
      await api.startIntake(token);
      setCurrentIndex(0);
      setCurrentAnswer(undefined);
      setAppState("questions");
    } catch (e) {
      setError((e as Error).message);
      setAppState("error");
    } finally {
      setSaving(false);
    }
  }, [token]);

  const handleNext = useCallback(async () => {
    if (!info) return;
    const question = info.questions[currentIndex];

    // Save current answer if provided
    if (currentAnswer !== undefined && currentAnswer !== "" && currentAnswer !== null) {
      try {
        setSaving(true);
        // Convert boolean string back to actual boolean for boolean type
        const answerToSave =
          question.type === "boolean"
            ? currentAnswer === "true"
            : question.type === "number"
            ? Number(currentAnswer)
            : currentAnswer;

        await api.saveAnswer(token, question.id, answerToSave);
        setAnswers((prev) => ({ ...prev, [question.id]: answerToSave }));
      } catch (e) {
        setError((e as Error).message);
        setAppState("error");
        return;
      } finally {
        setSaving(false);
      }
    }

    // Move to next or complete
    if (currentIndex < info.questions.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextAnswer = answers[info.questions[nextIndex].id];
      setCurrentIndex(nextIndex);
      setCurrentAnswer(nextAnswer ?? undefined);
    } else {
      // Last question — complete
      try {
        setAppState("submitting");
        await api.completeIntake(token);
        setAppState("done");
      } catch (e) {
        setError((e as Error).message);
        setAppState("error");
      }
    }
  }, [info, currentIndex, currentAnswer, answers, token]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentAnswer(answers[info!.questions[prevIndex].id] ?? undefined);
    }
  }, [currentIndex, answers, info]);

  // ── Render ──

  if (appState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (appState === "error") {
    return <ErrorScreen message={error} />;
  }

  if (appState === "done") {
    return <CompletedScreen />;
  }

  if (appState === "welcome" && info) {
    return <WelcomeScreen info={info} onStart={handleStart} loading={saving} />;
  }

  if (appState === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500">Отправляем данные врачу...</p>
      </div>
    );
  }

  // Questions screen
  if (!info) return null;
  const question = info.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === info.questions.length - 1;
  const canSkip = !question.required;
  const hasAnswer =
    currentAnswer !== undefined &&
    currentAnswer !== "" &&
    currentAnswer !== null &&
    !(Array.isArray(currentAnswer) && currentAnswer.length === 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pb-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto pt-4">
          <ProgressBar current={answeredCount} total={info.questions.length} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="mb-2 text-xs text-gray-400 uppercase tracking-wide font-medium">
          Вопрос {currentIndex + 1} из {info.questions.length}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-snug">
          {question.text}
        </h2>

        <QuestionInput
          question={question}
          value={currentAnswer}
          onChange={setCurrentAnswer}
        />
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-4 border-t border-gray-100 pb-safe-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={handleBack}
              disabled={saving}
              className="flex-1 rounded-xl border-2 border-gray-200 py-4 text-gray-700 font-medium hover:border-gray-300 disabled:opacity-50"
            >
              ← Назад
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving || (question.required && !hasAnswer)}
            className="flex-[2] bg-blue-600 text-white rounded-xl py-4 font-semibold disabled:opacity-50 hover:bg-blue-700 active:scale-95 transition-all"
          >
            {saving
              ? "Сохраняем..."
              : isLast
              ? "Завершить →"
              : canSkip && !hasAnswer
              ? "Пропустить →"
              : "Далее →"}
          </button>
        </div>
      </div>
    </div>
  );
}
