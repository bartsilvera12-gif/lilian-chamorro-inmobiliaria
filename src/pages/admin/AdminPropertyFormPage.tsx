import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { osorio } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import StyledSelect from '@/components/ui/StyledSelect';
import { Loader2, ArrowLeft, MapPin, Building2, Tag, CheckCircle, Coins, FileText, Plus, Trash2 } from 'lucide-react';
import { parsePaymentPlans } from '@/lib/osorioRepository';
import { toast } from 'sonner';
import {
  formatUsd,
  formatPyg,
  parseUsdInput,
  parsePygInput,
  type PriceCurrency,
  isPriceCurrency,
} from '@/lib/currency';

interface NeighborhoodOption { id: string; name: string; }
interface PropertyTypeOption { id: string; name: string; }

interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  price_currency: PriceCurrency;
  neighborhood_id: string;
  property_type: string;
  operation_type: string;
  status: string;
  bedrooms: string;
  bathrooms: string;
  area_m2: string;
  maps_url: string;
  available_from: string;
  available_until: string;
  plano_url: string;
}

const emptyForm: PropertyFormData = {
  title: '',
  description: '',
  price: '',
  price_currency: 'PYG',
  neighborhood_id: '',
  property_type: '',
  operation_type: 'venta', status: 'disponible', bedrooms: '', bathrooms: '', area_m2: '',
  maps_url: '', available_from: '', available_until: '', plano_url: '',
};

const operationTypes = ['venta', 'alquiler'];
const statusTypes = ['disponible', 'alquilado', 'vendido'];

export default function AdminPropertyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState<PropertyFormData>(emptyForm);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [quoteCount, setQuoteCount] = useState<number>(0);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [paymentPlanRows, setPaymentPlanRows] = useState<Array<{ cuotas: string; label: string }>>([
    { cuotas: '', label: '' },
  ]);

  useEffect(() => {
    const load = async () => {
      const [nRes, tRes] = await Promise.all([
        osorio.from('barrios').select('id, nombre').order('nombre'),
        osorio.from('property_types').select('id, nombre').order('nombre'),
      ]);
      setNeighborhoods((nRes.data ?? []).map((x: any) => ({ id: x.id, name: x.nombre })));
      setPropertyTypes((tRes.data ?? []).map((x: any) => ({ id: x.id, name: x.nombre })));

      if (isEdit && id) {
        const { data } = await osorio
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();
        if (data) {
          const cur: PriceCurrency = isPriceCurrency((data as { price_currency?: string }).price_currency)
            ? (data as { price_currency: PriceCurrency }).price_currency
            : 'PYG';
          const priceNum = data.price != null ? Number(data.price) : NaN;
          let priceStr = '';
          if (Number.isFinite(priceNum) && priceNum >= 0) {
            priceStr =
              cur === 'USD'
                ? (priceNum % 1 !== 0 ? priceNum.toFixed(2) : String(Math.round(priceNum)))
                : String(Math.round(priceNum));
          }
          setForm({
            title: data.title ?? '',
            description: data.description ?? '',
            price: priceStr,
            price_currency: cur,
            neighborhood_id: data.barrio_id ?? '',
            property_type: data.property_type_id ?? '',
            operation_type: data.operation_type ?? 'venta',
            status: data.status ?? 'disponible',
            bedrooms: data.bedrooms?.toString() ?? '',
            bathrooms: data.bathrooms?.toString() ?? '',
            area_m2: data.area_m2?.toString() ?? '',
            maps_url: data.location_url ?? '',
            available_from: data.available_from ?? '',
            available_until: data.available_to ?? '',
            plano_url: (data as { plano_url?: string | null }).plano_url ?? '',
          });
          setQuoteCount(data.quote_count ?? 0);
          const parsedPlans = parsePaymentPlans((data as { payment_plans?: unknown }).payment_plans);
          setPaymentPlanRows(
            parsedPlans.length > 0
              ? parsedPlans.map((p) => ({ cuotas: String(p.cuotas), label: p.label ?? '' }))
              : [{ cuotas: '', label: '' }]
          );

          const { data: imgs } = await osorio
            .from('property_images')
            .select('image_url, sort_order, is_primary')
            .eq('property_id', id)
            .order('sort_order', { ascending: true });

          const urls = (imgs ?? [])
            .map((img: any) => img.image_url as string)
            .filter(Boolean);

          setImageUrls(urls.length > 0 ? urls : ['']);
        }
      }
      setFetching(false);
    };
    load();
  }, [id, isEdit, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    setImageUrls(prev => prev.map((u, i) => (i === index ? value : u)));
  };

  const addImageUrl = () => {
    setImageUrls(prev => [...prev, '']);
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const syncPropertyImagesByUrl = async (propertyId: string) => {
    const cleaned = imageUrls.map(x => x.trim()).filter(Boolean);
    for (const url of cleaned) {
      if (!/^https?:\/\/.+/.test(url)) {
        throw new Error(`URL de imagen inválida: ${url}`);
      }
    }

    const { error: deleteError } = await osorio
      .from('property_images')
      .delete()
      .eq('property_id', propertyId);
    if (deleteError) throw deleteError;

    if (cleaned.length === 0) return;

    const payload = cleaned.map((url, idx) => ({
      property_id: propertyId,
      image_url: url,
      is_primary: idx === 0,
      sort_order: idx,
    }));

    const { error: insertError } = await osorio
      .from('property_images')
      .insert(payload);
    if (insertError) throw insertError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.neighborhood_id || !form.property_type || !form.operation_type || !form.status) {
      toast.error('Completá los campos obligatorios');
      return;
    }
    if (form.price_currency === 'USD') {
      const priceUsd = parseUsdInput(form.price);
      if (!Number.isFinite(priceUsd) || priceUsd < 0) {
        toast.error('Precio en USD inválido');
        return;
      }
    } else {
      const pyg = parsePygInput(form.price);
      if (!Number.isFinite(pyg) || pyg < 0) {
        toast.error('Precio en guaraníes inválido');
        return;
      }
    }
    if (form.maps_url && !/^https?:\/\/.+/.test(form.maps_url)) {
      toast.error('La URL de ubicación debe ser una URL válida');
      return;
    }
    const planoTrim = form.plano_url.trim();
    if (planoTrim && !/^https?:\/\/.+/.test(planoTrim)) {
      toast.error('La URL del plano debe ser http(s) válida');
      return;
    }
    setLoading(true);

    const priceUsd = parseUsdInput(form.price);
    const pyg = parsePygInput(form.price);
    const numericPrice =
      form.price_currency === 'USD'
        ? priceUsd
        : pyg;

    const payment_plans = paymentPlanRows
      .map((r) => ({
        cuotas: parseInt(r.cuotas, 10),
        label: r.label.trim() || undefined,
      }))
      .filter((r) => Number.isFinite(r.cuotas) && r.cuotas > 0);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: numericPrice,
      price_currency: form.price_currency,
      barrio_id: form.neighborhood_id,
      property_type_id: form.property_type,
      operation_type: form.operation_type,
      status: form.status,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      area_m2: form.area_m2 ? parseFloat(form.area_m2) : null,
      location_url: form.maps_url.trim() || null,
      available_from: form.available_from || null,
      available_to: form.available_until || null,
      plano_url: planoTrim || null,
      payment_plans,
    };

    let error;
    let propertyId = id;
    if (isEdit) {
      ({ error } = await osorio.from('properties').update(payload).eq('id', id));
    } else {
      const insertRes = await osorio
        .from('properties')
        .insert(payload)
        .select('id')
        .single();

      error = insertRes.error;
      propertyId = insertRes.data?.id;
    }

    if (!error && propertyId) {
      try {
        await syncPropertyImagesByUrl(propertyId);
      } catch (imgError: any) {
        setLoading(false);
        toast.error('Error en imágenes: ' + (imgError?.message ?? 'No se pudieron guardar URLs'));
        return;
      }
    }

    setLoading(false);
    if (error) {
      toast.error('Error: ' + error.message);
    } else {
      toast.success(isEdit ? 'Propiedad actualizada' : 'Propiedad creada');
      navigate('/admin/properties');
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-32"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const inputCls = 'w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40';
  const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/properties')} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-5">
          <div>
            <label className={labelCls}>Título *</label>
            <input name="title" value={form.title} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputCls} h-auto py-3`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Moneda del precio *</label>
              <StyledSelect icon={Coins} name="price_currency" value={form.price_currency} onChange={handleChange} required>
                <option value="PYG">Guaraníes (Gs.)</option>
                <option value="USD">Dólares (USD)</option>
              </StyledSelect>
            </div>
            <div>
              <label className={labelCls}>Barrio *</label>
              <StyledSelect icon={MapPin} name="neighborhood_id" value={form.neighborhood_id} onChange={handleChange} required>
                <option value="">Seleccionar barrio</option>
                {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </StyledSelect>
            </div>
          </div>
          <div>
            <label className={labelCls}>
              {form.price_currency === 'USD' ? 'Precio (USD) *' : 'Precio (guaraníes) *'}
            </label>
            <input
              name="price"
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={handleChange}
              required
              className={inputCls}
              placeholder={form.price_currency === 'USD' ? '1307 o 150000' : '1500000 o 1.500.000'}
            />
            {form.price_currency === 'USD' &&
              form.price &&
              Number.isFinite(parseUsdInput(form.price)) && (
                <p className="text-xs text-muted-foreground mt-1">{formatUsd(parseUsdInput(form.price))}</p>
              )}
            {form.price_currency === 'PYG' &&
              form.price &&
              Number.isFinite(parsePygInput(form.price)) && (
                <p className="text-xs text-muted-foreground mt-1">{formatPyg(parsePygInput(form.price))}</p>
              )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Tipo de propiedad *</label>
              <StyledSelect icon={Building2} name="property_type" value={form.property_type} onChange={handleChange} required>
                <option value="">{t('admin.select_tipo')}</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </StyledSelect>
            </div>
            <div>
              <label className={labelCls}>Tipo de operación *</label>
              <StyledSelect icon={Tag} name="operation_type" value={form.operation_type} onChange={handleChange} required>
                {operationTypes.map(op => <option key={op} value={op}>{t(`op.${op}`)}</option>)}
              </StyledSelect>
            </div>
            <div>
              <label className={labelCls}>Estado *</label>
              <StyledSelect icon={CheckCircle} name="status" value={form.status} onChange={handleChange} required>
                {statusTypes.map(s => <option key={s} value={s}>{t(`estado.${s}`)}</option>)}
              </StyledSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Habitaciones</label>
              <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Baños</label>
              <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Superficie (m²)</label>
              <input name="area_m2" type="number" min="0" step="0.01" value={form.area_m2} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Disponible desde</label>
              <input name="available_from" type="date" value={form.available_from} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Disponible hasta</label>
              <input name="available_until" type="date" value={form.available_until} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ubicación (URL de Google Maps)</label>
            <input name="maps_url" type="url" value={form.maps_url} onChange={handleChange} placeholder="https://maps.google.com/..." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Plano (URL imagen o PDF)</label>
            <input
              name="plano_url"
              type="url"
              value={form.plano_url}
              onChange={handleChange}
              placeholder="https://..."
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">Se muestra en la ficha pública debajo de la descripción.</p>
          </div>

          <div className="space-y-3">
            <label className={`${labelCls} flex items-center gap-2`}>
              <FileText className="w-4 h-4 text-muted-foreground" />
              Planes de pago
            </label>
            <p className="text-xs text-muted-foreground -mt-1">Cantidad de cuotas; podés agregar una etiqueta opcional (ej. &quot;Banco&quot;).</p>
            <div className="space-y-2">
              {paymentPlanRows.map((row, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[100px]">
                    <span className="text-xs text-muted-foreground block mb-1">Cuotas</span>
                    <input
                      type="number"
                      min={1}
                      value={row.cuotas}
                      onChange={(e) =>
                        setPaymentPlanRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, cuotas: e.target.value } : r))
                        )
                      }
                      className={inputCls}
                      placeholder="12"
                    />
                  </div>
                  <div className="flex-[2] min-w-[140px]">
                    <span className="text-xs text-muted-foreground block mb-1">Etiqueta (opcional)</span>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) =>
                        setPaymentPlanRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, label: e.target.value } : r))
                        )
                      }
                      className={inputCls}
                      placeholder="Ej. financiación"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentPlanRows((prev) => {
                        const next = prev.filter((_, i) => i !== index);
                        return next.length > 0 ? next : [{ cuotas: '', label: '' }];
                      })
                    }
                    className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 shrink-0"
                    aria-label="Quitar plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPaymentPlanRows((prev) => [...prev, { cuotas: '', label: '' }])}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Añadir plan
            </button>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Imágenes (URLs)</label>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder="https://..."
                    className={`${inputCls} h-10`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="text-sm text-muted-foreground hover:text-foreground px-2"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addImageUrl}
              className="text-sm text-primary hover:underline"
            >
              + Añadir imagen
            </button>
            <p className="text-xs text-muted-foreground">
              La primera URL se usa como imagen principal en integraciones que solo leen un campo.
            </p>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-3 rounded-xl">
              <span>Cotizaciones acumuladas:</span>
              <span className="font-bold text-foreground">{quoteCount}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/admin/properties')} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear propiedad'}
            </button>
          </div>
        </form>

      </div>
    </AdminLayout>
  );
}
