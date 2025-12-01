import QrLogin from "../components/Auth/QrLogin";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-vz-gradient">
      <div className="bg-black/40 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Вход в VZALE
        </h1>
        <p className="text-sm text-white/70 mb-6">
          Войди через Telegram, чтобы связать аккаунт на сайте с ботом.
        </p>
        <QrLogin />
      </div>
    </main>
  );
}
