import TelegramLoginButton from "../components/Auth/TelegramLoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-vz-gradient">
      <div className="bg-black/40 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Вход в VZALE
        </h1>
        <TelegramLoginButton />
      </div>
    </main>
  );
}
