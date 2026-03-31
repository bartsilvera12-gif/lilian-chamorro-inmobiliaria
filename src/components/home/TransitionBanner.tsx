import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, MapPin, Shield } from 'lucide-react';
import { fetchTransitionStats } from '@/lib/osorioRepository';

export default function TransitionBanner() {
  const { t } = useLanguage();
  const [quotesCount, setQuotesCount] = useState<number>(0);
  const [barriosCount, setBarriosCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const stats = await fetchTransitionStats();
      if (!active) return;
      setQuotesCount(stats.quotesCount);
      setBarriosCount(stats.barriosCount);
    })();
    return () => { active = false; };
  }, []);

  const stats = [
    {
      icon: TrendingUp,
      value: quotesCount > 0 ? `+${quotesCount}` : '0',
      label: t('banner.quotes_done'),
    },
    {
      icon: MapPin,
      value: `${barriosCount}`,
      label: t('banner.coverage_asuncion'),
    },
    {
      icon: Shield,
      value: t('banner.free'),
      label: t('banner.instant_estimate'),
    },
  ];

  return (
    <section className="py-10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`animate-reveal ${i > 0 ? `animate-reveal-delay-${i}` : ''} group relative overflow-hidden rounded-2xl bg-primary p-7 flex items-center gap-5 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="relative">
                <p className="text-2xl md:text-3xl font-extrabold text-white leading-none tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm text-white/60 mt-1.5 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
