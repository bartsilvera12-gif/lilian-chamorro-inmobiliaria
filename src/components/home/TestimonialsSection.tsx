import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, Quote, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchTestimonials, type Testimonial } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";

export default function TestimonialsSection() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [translatedById, setTranslatedById] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchTestimonials(12);
      if (!active) return;
      setItems(rows);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (lang === "es") {
      setTranslatedById({});
      return;
    }
    const target = lang === "en" ? "en" : "pt";
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const item of items) {
        const out = await translateFromEs(item.review_es, target);
        if (cancelled) return;
        next[item.id] = out;
      }
      if (!cancelled) setTranslatedById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [items, lang]);

  const visible = useMemo(() => items.slice(0, 3), [items]);
  const getReview = (item: Testimonial) =>
    lang === "es" ? item.review_es : translatedById[item.id] ?? item.review_es;

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 mb-5">
              <Quote className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {t("testimonials.badge")}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.08] tracking-tight">
              {t("testimonials.title")}
            </h2>
            <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed">
              {t("testimonials.subtitle")}
            </p>
          </div>
          {items.length > 0 && (
            <Link
              to="/testimonios"
              className="hidden md:inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-lg hover:shadow-xl"
            >
              {t("featured.view_all")} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay reseñas cargadas.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {visible.map((item, i) => (
              <article
                key={item.id}
                className={`w-full md:w-[calc(50%-12px)] xl:w-[calc(33.333%-16px)] animate-reveal ${
                  i > 0 ? `animate-reveal-delay-${Math.min(i, 4)}` : ""
                } rounded-2xl overflow-hidden bg-card border border-border card-hover`}
              >
                <div className="p-6 md:p-7">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-4">
                    <Quote className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s < item.stars ? "fill-amber text-amber" : "text-muted-foreground/35"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed line-clamp-8">{getReview(item)}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-12 text-center md:hidden">
            <Link
              to="/testimonios"
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-lg"
            >
              {t("featured.view_all")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
