import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { formatPricePerM2FromPyg, formatPropertyPriceFromPyg } from '@/lib/currency';
import Layout from '@/components/layout/Layout';
import { Building2, MessageSquare, MapPin, LogOut, Loader2, Home, Eye } from 'lucide-react';

interface ProductInmobiliaria {
  id: string;
  title: string;
  price: number;
  neighborhood_text: string;
  property_type: string;
  operation_type: string;
  status: string;
  main_image_url: string;
  quote_count: number;
  is_published: boolean;
}

interface QuoteItem {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string;
  status: string;
  created_at: string;
  product_id: string;
}

interface NeighborhoodItem {
  id: string;
  name: string;
  property_type: string;
  price_per_m2_reference: number;
}

export default function AdminDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<ProductInmobiliaria[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'properties' | 'quotes' | 'neighborhoods'>('properties');

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, profile, navigate]);

  useEffect(() => {
    if (!profile?.store_id) return;

    const fetchData = async () => {
      setLoading(true);
      const storeId = profile.store_id;

      const [propsRes, quotesRes, neighRes] = await Promise.all([
        supabase.from('products_inmobiliaria').select('*').eq('store_id', storeId),
        supabase.from('quotes').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
        supabase.from('neighborhoods').select('*').eq('store_id', storeId),
      ]);

      setProperties(propsRes.data ?? []);
      setQuotes(quotesRes.data ?? []);
      setNeighborhoods(neighRes.data ?? []);
      setLoading(false);
    };

    fetchData();
  }, [profile?.store_id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin', { replace: true });
  };

  if (authLoading || !profile) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const tabs = [
    { key: 'properties' as const, label: 'Propiedades', icon: Building2, count: properties.length },
    { key: 'quotes' as const, label: 'Cotizaciones', icon: MessageSquare, count: quotes.length },
    { key: 'neighborhoods' as const, label: 'Barrios', icon: MapPin, count: neighborhoods.length },
  ];

  return (
    <Layout>
      <div className="container py-8 min-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panel Administrativo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.full_name} · {profile.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.97]"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 flex-1 justify-center ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'properties' && (
              <div className="space-y-3">
                {properties.length === 0 ? (
                  <EmptyState icon={Building2} text="No hay propiedades registradas" />
                ) : (
                  properties.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                      <img src={p.main_image_url} alt={p.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{p.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.neighborhood_text} · {p.property_type} · {p.operation_type}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-foreground">
                          {formatPropertyPriceFromPyg(p.price ?? 0, p.operation_type === 'alquiler')}
                        </p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {p.quote_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="space-y-3">
                {quotes.length === 0 ? (
                  <EmptyState icon={MessageSquare} text="No hay cotizaciones recibidas" />
                ) : (
                  quotes.map(q => (
                    <div key={q.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{q.customer_name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{q.customer_email} · {q.customer_phone}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          q.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {q.status === 'pending' ? 'Pendiente' : q.status}
                        </span>
                      </div>
                      {q.message && (
                        <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">{q.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(q.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'neighborhoods' && (
              <div className="space-y-3">
                {neighborhoods.length === 0 ? (
                  <EmptyState icon={MapPin} text="No hay barrios configurados" />
                ) : (
                  neighborhoods.map(n => (
                    <div key={n.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{n.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.property_type}</p>
                      </div>
                      <p className="font-bold text-sm text-foreground">
                        {formatPricePerM2FromPyg(n.price_per_m2_reference ?? 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
