import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">PreVisit</h1>
        <p className="text-gray-500">Для пациентов: откройте ссылку из вашего уведомления</p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Войти как врач →
          </Link>
        </div>
      </div>
    </main>
  );
}
