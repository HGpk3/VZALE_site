"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function TelegramLoginButton() {
  useEffect(() => {
    const containerId = "telegram-login-button-container";
    const container = document.getElementById(containerId);
    if (!container) return;

    // очищаем, чтобы не плодить несколько виджетов при hot-reload
    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";

    // ⚠️ ОБЯЗАТЕЛЬНО: username бота БЕЗ @
    // Если твой бот в Telegram называется @vzalebb_bot,
    // то здесь должно быть "vzalebb_bot"
    script.setAttribute("data-telegram-login", "vzalebb_bot");

    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");

    // 👉 Ключевой момент: говорим виджету, какую JS-функцию вызвать после логина
    script.setAttribute("data-onauth", "onTelegramAuth");

    container.appendChild(script);

    // регистрируем колбэк в window
    window.onTelegramAuth = async function (user: any) {
      // чисто чтобы ты увидела, что оно сработало:
      alert(`Привет, ${user.first_name || "игрок"}! Telegram ID: ${user.id}`);

      try {
        // отправляем данные на API, который мы уже делали
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        const data = await res.json();
        if (data.ok) {
          // успешный логин → обновляем страницу личного кабинета
          window.location.href = "/me";
        } else {
          console.error("Auth error:", data.error);
          alert("Ошибка авторизации на сервере");
        }
      } catch (e) {
        console.error("Auth request failed", e);
        alert("Не удалось связаться с сервером");
      }
    };

    return () => {
      container.innerHTML = "";
      window.onTelegramAuth = undefined;
    };
  }, []);

  return (
    <div
      id="telegram-login-button-container"
      className="flex justify-center"
    />
  );
}
