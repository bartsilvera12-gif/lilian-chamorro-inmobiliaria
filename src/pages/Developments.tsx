import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchDevelopments, type DevelopmentItem } from "@/lib/osorioRepository";
import { translateFromEs } from "@/lib/autoTranslate";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "595987276000";

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
        const out = await translateFromEs(item.description_es, target);
        if (cancelled) return;
        next[item.id] = out;
      }
      if (!cancelled) setTranslatedById(next);
    })();
    return () => {
      cancelled = true;
    };
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
      <section className="py-24 md:py-32 surface-warm">
        <div className="container">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.08] tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed">{subtitle}</p>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay desarrollos cargados.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${Math.min(i, 4)}` : ""} rounded-2xl overflow-hidden bg-card border border-border card-hover`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image_url}
                      alt="Desarrollo"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-foreground/85 leading-relaxed line-clamp-3 mb-4">{getDesc(item)}</p>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, me interesa más información sobre un desarrollo.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Más info
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

