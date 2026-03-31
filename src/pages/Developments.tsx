import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchDevelopments, type DevelopmentItem } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "595986965042";

export default function DevelopmentsPage() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<DevelopmentItem[]>([]);
  const [translatedById, setTranslatedById] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchDevelopments(60);
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
        const out = await translateFromEs(item.description_es, target);
        if (cancelled) return;
        next[item.id] = out;
      }
      if (!cancelled) setTranslatedById(next);
    })();
    return () => { cancelled = true; };
  }, [items, lang]);

  const title = useMemo(() => {
    if (lang === "en") return "Developments";
    if (lang === "pt") return "Desenvolvimento";
    return "Desarrollo";
  }, [lang]);

  const subtitle = useMemo(() => {
    if (lang === "en") return "Discover available models and projects.";
    if (lang === "pt") return "Conheça modelos e projetos disponíveis.";
    return "Conoce modelos y proyectos disponibles.";
  }, [lang]);

  const getDesc = (item: DevelopmentItem) =>
    lang === "es" ? item.description_es : translatedById[item.id] ?? item.description_es;

  return (
    <Layout>
      <section className="bg-primary py-16 md:py-20">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground">{title}</h1>
          <p className="text-primary-foreground/40 text-sm font-sans mt-2">{subtitle}</p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground font-sans py-12">No hay desarrollos cargados.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${Math.min(i, 4)}` : ""} rounded-xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-premium`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image_url} alt="Desarrollo" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-foreground/75 leading-relaxed line-clamp-3 mb-4 font-sans">{getDesc(item)}</p>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, me interesa más información sobre un desarrollo.")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-gold text-xs h-9 px-4"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Más info
                    </a>
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
