import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, ArrowRight, TrendingUp, MapPin, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import StyledSelect from "@/components/ui/StyledSelect";
import { fetchCalculatorInputs, insertCalculatorLog } from "@/lib/osorioRepository";
import { formatUsd } from "@/lib/currency";
import { toast } from "sonner";

export default function CalculatorSection() {
  const { t } = useLanguage();
  const [barrioId, setBarrioId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [area, setArea] = useState("");

  const [tipoCalle, setTipoCalle] = useState<"asfalto" | "empedrado" | "tierra">("asfalto");
  const [cercaArroyo, setCercaArroyo] = useState(false);
  const [urgencia, setUrgencia] = useState<"apurado" | "no_apurado">("no_apurado");

  const [barrios, setBarrios] = useState<Array<{ id: string; nombre: string; coeficiente: number }>>([]);
  const [tipos, setTipos] = useState<Array<{ id: string; nombre: string; coeficiente: number }>>([]);
  const [loading, setLoading] = useState(true);

  const [result, setResult] = useState<{
    estimated: number;
    min: number;
    max: number;
    vreal: number;
    plista: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const inputs = await fetchCalculatorInputs();
      if (!active) return;
      setBarrios(inputs.barrios);
      setTipos(inputs.types);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const selectedBarrio = useMemo(() => barrios.find((b) => b.id === barrioId) ?? null, [barrios, barrioId]);
  const selectedTipo = useMemo(() => tipos.find((t) => t.id === tipoId) ?? null, [tipos, tipoId]);

  const fmt = (n: number) => formatUsd(n, 0);

  const PRECIO_BASE_M2 = 500;
  const MARGEN = 1.40;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarrio) { toast.error(t('calc.error.select_barrio')); return; }
    if (!selectedTipo) { toast.error(t('calc.error.select_tipo')); return; }
    if (!area) { toast.error(t('calc.error.surface_required')); return; }

    const areaNum = parseFloat(area);
    if (!Number.isFinite(areaNum) || areaNum <= 0) { toast.error(t('calc.error.surface_invalid')); return; }

    const C_ciudad = selectedBarrio.coeficiente;
    const C_vial = tipoCalle === "asfalto" ? 1.2 : tipoCalle === "empedrado" ? 1.05 : 0.9;
    const C_arroyo = cercaArroyo ? 0.75 : 1.0;
    const C_tipo = selectedTipo.coeficiente;
    const C_urgencia = urgencia === "apurado" ? 0.92 : 0.95;

    const Vu = PRECIO_BASE_M2 * C_ciudad * C_vial * C_arroyo * C_tipo * C_urgencia;
    const Vreal = Vu * areaNum;
    const Plista = Vreal * MARGEN;

    setResult({ estimated: Vreal, min: Vreal, max: Plista, vreal: Vreal, plista: Plista });

    await insertCalculatorLog({
      barrio_id: barrioId, tipo_propiedad_id: tipoId, superficie: areaNum,
      tipo_calle: tipoCalle, cerca_arroyo: cercaArroyo, urgencia: urgencia, resultado_precio: Vreal,
    });
  };

  return (
    <section id="calculadora" className="py-24 md:py-32 surface-warm">
      <div className="container">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 mb-5">
            <Calculator className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{t('calc.title')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-[1.08] tracking-tight mb-4">
            {t('calc.title')}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t('calc.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch max-w-6xl mx-auto">
          {/* Navy info panel */}
          <div className="lg:col-span-6 animate-reveal flex">
            <div className="rounded-2xl bg-primary p-8 md:p-10 relative overflow-hidden shadow-xl flex flex-col w-full min-h-[min(520px,70vh)]">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/15 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl" />
              <div className="relative flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <TrendingUp className="w-5 h-5 text-white" aria-hidden />
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{t('calc.value_estimate')}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-8">{t('calc.market_based')}</p>
                <div className="rounded-xl overflow-hidden border border-white/10 mb-6">
                  <img src="https://res.cloudinary.com/drupicep5/image/upload/v1774017227/2485c5e1-0fa2-4357-ac0b-d17ad7c6a43b.png" alt="Calculadora de valor" className="w-full h-44 object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  {barrios.slice(0, 4).map((nb) => (
                    <div key={nb.id} className="rounded-xl bg-white/[0.07] px-4 py-3 border border-white/[0.06]">
                      <p className="text-[11px] text-white/45 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{nb.nombre}</p>
                      <p className="text-sm font-bold text-white">C: {nb.coeficiente.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form — misma anchura que el panel azul (6/6) y altura alineada */}
          <div className="lg:col-span-6 animate-reveal animate-reveal-delay-2 flex">
            <div className="bg-card rounded-2xl p-7 md:p-9 pb-10 md:pb-12 shadow-xl border border-border/60 flex flex-col w-full min-h-[min(520px,70vh)]">
              <form onSubmit={handleCalculate} className="space-y-5 flex flex-col flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('calc.barrio')}</label>
                    <StyledSelect icon={MapPin} value={barrioId} onChange={(e) => setBarrioId(e.target.value)} required>
                      <option value="">{t('hero.search.all_barrios')}</option>
                      {barrios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                    </StyledSelect>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('calc.tipo')}</label>
                    <StyledSelect icon={Building2} value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                      <option value="">{t('hero.search.all_tipos')}</option>
                      {tipos.map((tp) => <option key={tp.id} value={tp.id}>{tp.nombre}</option>)}
                    </StyledSelect>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">{t('calc.area')}</label>
                  <div className="relative">
                    <input type="number" min="1" value={area} onChange={e => setArea(e.target.value)} required placeholder="150"
                      className="w-full h-12 rounded-xl border border-border bg-background pl-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">m²</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('calc.calle')}</label>
                    <div className="space-y-2">
                      {(["asfalto", "empedrado", "tierra"] as const).map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm text-foreground">
                          <input type="radio" name="tipoCalle" value={v} checked={tipoCalle === v} onChange={() => setTipoCalle(v)} className="accent-primary" />
                          {v === "asfalto" ? t('calc.calle.asfalto') : v === "empedrado" ? t('calc.calle.empedrado') : t('calc.calle.tierra')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('calc.cerca_arroyo')}</label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={cercaArroyo} onChange={(e) => setCercaArroyo(e.target.checked)} className="accent-primary" />
                      {t('calc.cerca_arroyo.si')}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('calc.urgencia')}</label>
                    <StyledSelect value={urgencia} onChange={(e) => setUrgencia(e.target.value as "apurado" | "no_apurado")}>
                      <option value="apurado">{t('calc.urgencia.apurado')}</option>
                      <option value="no_apurado">{t('calc.urgencia.no_apurado')}</option>
                    </StyledSelect>
                  </div>
                </div>

                {selectedBarrio && (
                  <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Building2 className="w-4 h-4 text-primary" /><span className="font-medium">{selectedBarrio.nombre}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">C: {selectedBarrio.coeficiente.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex-1 min-h-4" aria-hidden />
                <button type="submit" className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all duration-150 shadow-lg mt-auto">
                  <Calculator className="w-4 h-4" />{t('calc.calculate')}
                </button>
              </form>

              {result && (
                <div className="mt-7 rounded-2xl bg-primary p-7 animate-reveal relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">{t('calc.result')}</p>
                        <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{fmt(result.estimated)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl bg-white/[0.07] border border-white/[0.06] px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">{t('calc.min')}</p>
                        <p className="text-sm font-bold text-white">{fmt(result.min)}</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.07] border border-white/[0.06] px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">{t('calc.max')}</p>
                        <p className="text-sm font-bold text-white">{fmt(result.max)}</p>
                      </div>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden mb-5">
                      <div className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500"
                        style={{ left: "0%", width: result.max === result.min ? "100%" : `${Math.round(((result.estimated - result.min) / (result.max - result.min)) * 100)}%` }} />
                    </div>
                    <Link to="/propiedades" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors">
                      {t('calc.to_quote')} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
