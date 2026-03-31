import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchTestimonials, type Testimonial } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";
import { Star, UserCircle } from "lucide-react";

export default function TestimonialsPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [translatedById, setTranslatedById] = useState<Record<string, string>>({});

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchTestimonials(50);
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

  const getReview = (item: Testimonial) =>
    lang === "es" ? item.review_es : translatedById[item.id] ?? item.review_es;

  return (
    <Layout>
      <section className="bg-primary py-16 md:py-20">
        <div className="container text-center">
          <p className="text-xs font-sans font-semibold uppercase tracking-[0.15em] text-accent mb-3">{t("testimonials.badge")}</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground">{t("testimonials.title")}</h1>
          <p className="text-primary-foreground/40 text-sm font-sans mt-2">{t("testimonials.subtitle")}</p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground font-sans py-12">No hay reseñas cargadas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${Math.min(i, 4)}` : ""} rounded-xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col`}
                >
                  <div className="h-[3px] bg-accent" />
                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className={`w-[18px] h-[18px] ${s < item.stars ? "fill-accent text-accent" : "text-border"}`} />
                      ))}
                    </div>
                    <div className="flex-1 mb-6">
                      <p className="text-sm text-foreground/70 leading-[1.85] font-sans">
                        <span className="inline-block mr-1 align-text-top text-accent/30">"</span>
                        {getReview(item)}
                        <span className="inline-block ml-0.5 align-text-top text-accent/30">"</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-5 mt-auto border-t border-border">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-sans text-foreground">Cliente Verificado</p>
                        <p className="text-[11px] font-sans text-muted-foreground">Lilian Chamorro Bienes Raíces</p>
                      </div>
                    </div>
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
