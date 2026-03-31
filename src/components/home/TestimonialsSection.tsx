import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, ArrowRight } from "lucide-react";
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
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (lang === "es") { setTranslatedById({}); return; }
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
    return () => { cancelled = true; };
  }, [items, lang]);

  const visible = useMemo(() => items.slice(0, 3), [items]);
  const getReview = (item: Testimonial) =>
    lang === "es" ? item.review_es : translatedById[item.id] ?? item.review_es;

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="section-label">{t("testimonials.badge")}</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed font-sans">{t("testimonials.subtitle")}</p>
        </div>

        {visible.length === 0 ? (
          <p className="text-center text-muted-foreground font-sans">No hay reseñas cargadas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visible.map((item, i) => {
              const isDark = i === 1;
              return (
                <article
                  key={item.id}
                  className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${i}` : ''} rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                    isDark
                      ? 'bg-primary text-primary-foreground shadow-xl'
                      : 'bg-card border border-border shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="h-[3px] bg-accent" />

                  <div className="p-7 flex flex-col flex-1">
                    {/* Stars */}
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className={`w-[18px] h-[18px] ${
                          s < item.stars
                            ? 'fill-accent text-accent'
                            : isDark ? 'text-primary-foreground/20' : 'text-border'
                        }`} />
                      ))}
                    </div>

                    {/* Review text */}
                    <div className="flex-1 mb-6">
                      <p className={`text-sm leading-[1.85] font-sans ${isDark ? 'text-primary-foreground/85' : 'text-foreground/70'}`}>
                        <span className={`inline-block mr-1 align-text-top ${isDark ? 'text-accent/40' : 'text-accent/30'}`}>"</span>
                        {getReview(item)}
                        <span className={`inline-block ml-0.5 align-text-top ${isDark ? 'text-accent/40' : 'text-accent/30'}`}>"</span>
                      </p>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-12 text-center">
            <Link to="/testimonios" className="btn-gold">
              {t("featured.view_all")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
