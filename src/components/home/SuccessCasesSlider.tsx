import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Award, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchSuccessCases, type SuccessCase } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";

const FALLBACK_CASES: SuccessCase[] = [
  { id: "1", image_url: "", description_es: "Venta concretada en tiempo récord con estrategia de precio y difusión.", sort_order: 1, is_active: true },
  { id: "2", image_url: "", description_es: "Alquiler asegurado con inquilino calificado y gestión integral.", sort_order: 2, is_active: true },
];

export default function SuccessCasesSlider() {
  const { t, lang } = useLanguage();
  const [cases, setCases] = useState<SuccessCase[]>(FALLBACK_CASES);
  const [index, setIndex] = useState(0);
  const [translatedById, setTranslatedById] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchSuccessCases();
      if (!active) return;
      setCases(rows.length > 0 ? rows : FALLBACK_CASES);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cases.length <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % cases.length), 4000);
    return () => clearInterval(timer);
  }, [cases.length]);

  useEffect(() => {
    if (index >= cases.length) setIndex(0);
  }, [cases.length, index]);

  useEffect(() => {
    if (lang === "es") {
      setTranslatedById({});
      return;
    }
    const target = lang === "en" ? "en" : "pt";
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const c of cases) {
        const out = await translateFromEs(c.description_es, target);
        if (cancelled) return;
        next[c.id] = out;
      }
      if (!cancelled) setTranslatedById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [cases, lang]);

  const prev = () => setIndex((i) => (i - 1 + cases.length) % cases.length);
  const next = () => setIndex((i) => (i + 1) % cases.length);
  const getDesc = (row: SuccessCase) => {
    if (lang === "es") return row.description_es;
    return translatedById[row.id] ?? row.description_es;
  };

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 mb-5">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {t('success.case_label')}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.08] tracking-tight">
              {t('success.title')}
            </h2>
            <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed">
              {t('success.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={prev}
              className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-95 shadow-md"
              aria-label={t('success.prev')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-95 shadow-md"
              aria-label={t('success.next')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-xl">
          <div className="relative min-h-[320px] md:min-h-[360px]">
            {cases.map((c, i) => {
              const active = i === index;
              return (
                <div
                  key={c.id}
                  className={[
                    "absolute inset-0 transition-all duration-500 ease-out",
                    active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12 pointer-events-none",
                  ].join(" ")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    {/* Image */}
                    <div className="relative overflow-hidden">
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={`${t('success.case_label')} ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                            <Award className="relative w-20 h-20 text-white/15" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-14 flex flex-col justify-center bg-card">
                      <div className="flex items-center gap-3 mb-7">
                        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-white font-extrabold text-sm">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                          {t('success.case_label')}
                        </span>
                      </div>
                      <p className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line font-medium">
                        {getDesc(c)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 md:left-auto md:right-14 md:translate-x-0">
            {cases.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={[
                  "rounded-full transition-all duration-300",
                  i === index ? "w-8 h-2.5 bg-primary shadow-md" : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground/40",
                ].join(" ")}
                aria-label={`${t('success.go_to_case')} ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
