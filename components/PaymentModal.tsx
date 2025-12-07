"use client";

import { useMemo, useState } from "react";

const PAYMENT_LINK = "https://www.tinkoff.ru/rm/r_lXNVlLdhlc.HvLpSfyoBm/lp4m185877";

interface PaymentModalProps {
  triggerText?: string;
  className?: string;
  variant?: "primary" | "ghost";
}

export function PaymentModal({
  triggerText = "Оплатить взнос",
  className = "",
  variant = "primary",
}: PaymentModalProps) {
  const [open, setOpen] = useState(false);

  const triggerClasses = useMemo(() => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition";

    if (variant === "ghost") {
      return `${base} border border-white/15 bg-white/5 text-white hover:bg-white/10 ${className}`;
    }

    return `${base} bg-vz_green text-black shadow-[0_0_30px_rgba(164,255,79,0.5)] hover:brightness-110 ${className}`;
  }, [variant, className]);

  return (
    <>
      <button type="button" className={triggerClasses} onClick={() => setOpen(true)}>
        {triggerText}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-[min(720px,92vw)] rounded-2xl border border-white/10 bg-[#0C0A14] p-6 shadow-[0_10px_60px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Оплата</p>
                <h3 className="text-2xl font-bold text-white">Оплата взноса</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-white/80">
              <p className="text-lg font-semibold text-white">👥 За всю команду — 2600 ₽</p>
              <p>
                Мы очень старались сохранить турнир максимально доступным. Формат 2600 ₽ за команду — это та минимальная цена,
                которая позволяет нам продолжать делать для вас турниры.
              </p>
              <p>
                Нажми на кнопку ниже, чтобы открыть приложение банка и перевести нужную сумму. ❗ В комментарии к переводу укажи
                название своей команды.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={PAYMENT_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-vz_green px-5 py-3 text-sm font-semibold text-black hover:brightness-110 shadow-[0_0_30px_rgba(164,255,79,0.4)]"
              >
                Открыть оплату в банке
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export const PAYMENT_LINK_URL = PAYMENT_LINK;
