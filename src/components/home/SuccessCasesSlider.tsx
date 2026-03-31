import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchSuccessCases, type SuccessCase } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";

const FALLBACK_CASES: SuccessCase[] = [
  {
    id: "fb-1",
    image_url:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    description_es:
      "María vendió su casa en Villa Morra en pocos meses; hoy está conforme y recomienda el equipo de Lilian Chamorro Inmobiliaria.",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "fb-2",
    image_url:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80",
    description_es:
      "Roberto alquiló su departamento con un inquilino verificado y quedó muy conforme con la gestión transparente de principio a fin.",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "fb-3",
    image_url:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1200&q=80",
    description_es:
      "La familia Gómez compró su casa en Lambaré con asesoramiento cercano y negociación clara; celebraron el cierre con total confianza.",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "fb-4",
    image_url:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80",
    description_es:
      "Laura revalorizó su propiedad con una estrategia de venta profesional y recibió una oferta que superó sus expectativas.",
    sort_order: 4,
    is_active: true,
  },
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
    if (lang === "es") { setTranslatedById({}); return; }
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
    return () => { cancelled = true; };
  }, [cases, lang]);

  const prev = () => setIndex((i) => (i - 1 + cases.length) % cases.length);
  const next = () => setIndex((i) => (i + 1) % cases.length);
  const getDesc = (row: SuccessCase) => lang === "es" ? row.description_es : translatedById[row.id] ?? row.description_es;

  return (
    <section className="py-20 md:py-28 surface-warm">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="section-label">{t('success.case_label')}</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{t('success.title')}</h2>
            <p className="text-muted-foreground mt-2 text-sm font-sans">{t('success.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={prev}
              className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              aria-label={t('success.prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={next}
              className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center hover:opacity-90 transition-colors"
              aria-label={t('success.next')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative min-h-[280px] md:min-h-[320px]">
            {cases.map((c, i) => {
              const active = i === index;
              return (
                <div key={c.id} className={`absolute inset-0 transition-all duration-500 ${active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    <div className="relative overflow-hidden bg-muted">
                      {c.image_url ? (
                        <img src={c.image_url} alt={`${t('success.case_label')} ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary">
                          <Award className="w-16 h-16 text-accent/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm font-sans">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">{t('success.case_label')}</span>
                      </div>
                      <p className="text-base md:text-lg text-foreground leading-relaxed font-sans">{getDesc(c)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:left-auto md:right-12 md:translate-x-0">
            {cases.map((_, i) => (
              <button key={i} type="button" onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 ${i === index ? "w-6 h-2 bg-accent" : "w-2 h-2 bg-border hover:bg-muted-foreground/30"}`}
                aria-label={`${t('success.go_to_case')} ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
