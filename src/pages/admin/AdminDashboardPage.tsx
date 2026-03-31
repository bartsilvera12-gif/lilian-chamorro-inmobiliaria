import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { osorio } from '@/lib/supabase';
import { fetchAllPropertiesRows } from '@/lib/osorioRepository';
import AdminLayout from '@/components/admin/AdminLayout';
import { Building2, MessageSquare, CheckCircle, XCircle, Loader2, TrendingUp, Phone, Mail } from 'lucide-react';

interface DashboardStats {
  totalProperties: number;
  available: number;
  rented: number;
  totalQuotes: number;
}

interface TopProperty {
  id: string;
  title: string;
  quote_count: number;
  status: string;
  property_type: string;
  operation_type: string;
}

interface RecentQuote {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  mensaje: string | null;
  created_at: string;
  property_id: string;
}

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalProperties: 0, available: 0, rented: 0, totalQuotes: 0 });
  const [topProperties, setTopProperties] = useState<TopProperty[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [propMap, setPropMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [propsRes, quotesRes] = await Promise.all([
        fetchAllPropertiesRows(
          'id, title, quote_count, status, property_type_id, operation_type',
          'created_at',
          false
        ),
        osorio.from('quotes').select('id, nombre, email, telefono, mensaje, created_at, property_id').order('created_at', { ascending: false }).limit(20),
      ]);

      if (propsRes.error) {
        // eslint-disable-next-line no-console
        console.error('[AdminDashboard] properties', propsRes.error);
      }
      const props = propsRes.data ?? [];
      const quotes = quotesRes.data ?? [];

      const typeIds = Array.from(new Set(props.map((p: any) => p.property_type_id).filter(Boolean)));
      const typeMap: Record<string, string> = {};
      const chunk = 100;
      for (let i = 0; i < typeIds.length; i += chunk) {
        const slice = typeIds.slice(i, i + chunk);
        const { data: typesData } = await osorio.from('property_types').select('id, nombre').in('id', slice);
        for (const t of typesData ?? []) typeMap[(t as any).id] = (t as any).nombre;
      }

      setStats({
        totalProperties: props.length,
        available: props.filter(p => p.status === 'disponible').length,
        rented: props.filter(p => p.status === 'alquilado').length,
        totalQuotes: quotes.length,
      });

      setTopProperties(
        [...props]
          .sort((a: any, b: any) => (b.quote_count ?? 0) - (a.quote_count ?? 0))
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            quote_count: p.quote_count ?? 0,
            status: p.status,
            property_type: typeMap[p.property_type_id] ?? '—',
            operation_type: p.operation_type,
          }))
      );

      setRecentQuotes(
        (quotes ?? []).slice(0, 10).map((q: any) => ({
          id: q.id,
          nombre: q.nombre,
          email: q.email,
          telefono: q.telefono,
          mensaje: q.mensaje,
          created_at: q.created_at,
          property_id: q.property_id,
        }))
      );

      setPropMap(Object.fromEntries(props.map((p: any) => [p.id, p.title])));
      setLoading(false);
    };

    fetchAll();
  }, [profile]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  const metricCards = [
    { label: 'Total Propiedades', value: stats.totalProperties, icon: Building2, color: 'text-accent-foreground bg-accent/15' },
    { label: 'Disponibles', value: stats.available, icon: CheckCircle, color: 'text-[hsl(var(--success))] bg-[hsl(var(--success-light))]' },
    { label: 'Alquiladas', value: stats.rented, icon: XCircle, color: 'text-[hsl(var(--amber))] bg-[hsl(var(--amber-light))]' },
    { label: 'Cotizaciones', value: stats.totalQuotes, icon: MessageSquare, color: 'text-accent bg-accent/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map(card => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Properties */}
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <TrendingUp className="w-4 h-4 text-accent-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Top Propiedades por Cotizaciones</h2>
            </div>
            <div className="divide-y divide-border">
              {topProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin propiedades</p>
              ) : (
                topProperties.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.property_type} · {p.operation_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'disponible' ? 'badge-disponible' : p.status === 'vendido' ? 'badge-vendido' : 'badge-alquilado'}`}>
                      {p.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-accent-foreground">
                      <MessageSquare className="w-3 h-3" />
                      {p.quote_count ?? 0}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Quotes */}
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <MessageSquare className="w-4 h-4 text-accent-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Últimas Cotizaciones</h2>
            </div>
            <div className="divide-y divide-border">
              {recentQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin cotizaciones</p>
              ) : (
                recentQuotes.map(q => (
                  <div key={q.id} className="px-5 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{q.nombre}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[hsl(var(--success-light))] text-[hsl(var(--success))]">
                        Nueva
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {q.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{q.email}</span>}
                      {q.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{q.telefono}</span>}
                    </div>
                    {q.property_id && (
                      <p className="text-xs text-accent-foreground font-medium">{propMap[q.property_id] ?? 'Propiedad'}</p>
                    )}
                    {q.mensaje && <p className="text-xs text-muted-foreground line-clamp-1">{q.mensaje}</p>}
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(q.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
