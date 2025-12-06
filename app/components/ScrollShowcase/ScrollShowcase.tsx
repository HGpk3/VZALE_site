"use client";

const slides = [
  {
    title: "Секция турнира",
    lead: "Показать всю важную информацию одним листом без прокрутки внутри блока.",
    bullets: [
      "Сверху — логотип, дата и кнопка вступить",
      "По центру — призы и адрес проведения",
      "Снизу — быстрые ссылки на сетку и оплату",
    ],
    accent: "Собранное первое впечатление",
  },
  {
    title: "Команда как карточка",
    lead: "Каждый капитан видит свою команду отдельной страницей, которую удобно листать.",
    bullets: [
      "Добавление и удаление игроков в один клик",
      "Статус оплаты и кнопка действия рядом",
      "Минимум деталей, максимум пользы",
    ],
    accent: "Чистое управление ростером",
  },
  {
    title: "Сетка и расписание",
    lead: "Страницы с группами и плей-офф листаются поверх друг друга — как раскрытая книжка.",
    bullets: [
      "Группы сверху, плей-офф ниже",
      "Подсветка текущего матча",
      "Ссылки на трансляции в карточках",
    ],
    accent: "Удобно следить за ходом турнира",
  },
];

export default function ScrollShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#05050a] px-6 py-16 text-white md:px-10 md:py-24">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2 md:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-vz_green">Плавный скролл</p>
          <h2 className="text-3xl font-black leading-tight md:text-4xl">Страницы-слои при прокрутке</h2>
          <p className="max-w-3xl text-sm text-white/75 md:text-base">
            Каждый блок — отдельный лист. Прокручиваешь — сверху всплывает следующий и накрывает предыдущий.
            Ни лишней анимации, только чёткое ощущение листания страниц.
          </p>
        </div>

        <div className="relative pb-40 pt-4">
          {slides.map((slide, index) => (
            <article
              key={slide.title}
              className="sticky top-20"
              style={{
                zIndex: slides.length - index,
                marginTop: index === 0 ? 0 : -120,
              }}
            >
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-lg md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-white/50">
                  <span className="rounded-full bg-white/10 px-3 py-1">Лист {index + 1}</span>
                  <span className="text-white/60">Стек при прокрутке</span>
                </div>

                <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-2xl font-semibold md:text-3xl">{slide.title}</h3>
                    <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80">
                      {slide.accent}
                    </span>
                  </div>
                  <p className="text-sm text-white/75 md:text-base">{slide.lead}</p>
                  <ul className="space-y-2 text-sm text-white/80 md:text-base">
                    {slide.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 rounded-2xl bg-white/5 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-vz_green" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
          <div className="h-[140px]" />
        </div>
      </div>
    </section>
  );
}
