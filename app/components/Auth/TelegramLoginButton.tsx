"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function TelegramLoginButton() {
  useEffect(() => {
    // создаём скрипт Telegram виджета
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;

    // ВАЖНО: сюда имя твоего бота БЕЗ @
    script.setAttribute("data-telegram-login", "vzalebb_bot"); // например: "vzale_bot"
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-lang", "ru");
    script.setAttribute("data-onauth", "onTelegramAuth");

    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(script);
    }

    // Функция, которую вызовет Telegram после логина
    window.onTelegramAuth = async function (user: any) {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        const data = await res.json();
        if (data.ok) {
          window.location.href = "/me";
        } else {
          console.error("Auth error:", data.error);
          alert("Ошибка авторизации через Telegram");
        }
      } catch (e) {
        console.error("Auth request failed", e);
        alert("Ошибка подключения к серверу");
      }
    };

    return () => {
      // очистка
      window.onTelegramAuth = undefined;
    };
  }, []);

  return <div id="telegram-login-container" className="flex justify-center" />;
}
