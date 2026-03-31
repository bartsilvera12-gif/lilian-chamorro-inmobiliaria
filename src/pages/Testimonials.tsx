import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchTestimonials, type Testimonial } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";
import { Quote, Star } from "lucide-react";

export default function TestimonialsPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [translatedById, setTranslatedById] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchTestimonials(50);
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

  const getReview = (item: Testimonial) =>
    lang === "es" ? item.review_es : translatedById[item.id] ?? item.review_es;

  return (
    <Layout>
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 mb-5">
              <Quote className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {t("testimonials.badge")}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.08] tracking-tight">
              {t("testimonials.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed">
              {t("testimonials.subtitle")}
            </p>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay reseñas cargadas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${Math.min(i, 4)}` : ""} rounded-2xl overflow-hidden bg-card border border-border card-hover`}
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
                    <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{getReview(item)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

