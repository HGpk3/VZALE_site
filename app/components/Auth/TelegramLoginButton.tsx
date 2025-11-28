"use client";

import { useEffect } from "react";

export default function TelegramLoginButton() {
  useEffect(() => {
    const containerId = "telegram-login-button-container";
    const container = document.getElementById(containerId);

    if (!container) return;

    // очищаем контейнер, чтобы не плодить виджеты при hot-reload
    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";

    // ⚠️ ВАЖНО: здесь должен быть ЮЗЕРНЕЙМ бота БЕЗ @
    // если бот называется @vzalebb_bot → пишешь "vzalebb_bot"
    script.setAttribute("data-telegram-login", "vzalebb_bot");

    script.setAttribute("data-size", "large");

    // 👉 здесь твой прод-домен на Vercel
    script.setAttribute(
      "data-auth-url",
      "https://vzale-site.vercel.app/api/auth/telegram-redirect"
    );

    // чтобы бот мог писать пользователю
    script.setAttribute("data-request-access", "write");

    // можно не показывать аватар, если не хочешь
    // script.setAttribute("data-userpic", "false");

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      id="telegram-login-button-container"
      className="flex justify-center"
    />
  );
}
