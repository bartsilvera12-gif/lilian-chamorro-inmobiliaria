import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { osorio } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import StyledSelect from '@/components/ui/StyledSelect';
import { Building2, Plus, Pencil, Trash2, MessageSquare, Loader2, Search, Bed, Bath, Maximize, Filter, ArrowUpDown } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatPropertyPrice, priceToComparablePyg, type PriceCurrency } from '@/lib/currency';
import {
  PROPERTIES_SELECT_FULL,
  PROPERTIES_SELECT_LEGACY,
  PROPERTIES_SELECT_WITHOUT_PLANO,
  looksLikeMissingColumnError,
  fetchAllPropertiesRows,
} from '@/lib/osorioRepository';

interface MinRow { id: string; name: string; }

interface PropertyRow {
  id: string;
  title: string;
  price: number;
  price_currency: PriceCurrency;
  barrio: string;
  property_type: string;
  operation_type: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  quote_count: number;
  created_at: string;
}

export default function AdminPropertiesPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [barrios, setBarrios] = useState<MinRow[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<MinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'quote_count' | 'price'>('created_at');

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    const orderCol = sortBy === 'price' ? 'created_at' : sortBy;
    const [pResFirst, nRes] = await Promise.all([
      fetchAllPropertiesRows(PROPERTIES_SELECT_FULL, orderCol, false),
      osorio.from('barrios').select('id, nombre').order('nombre'),
    ]);
    let pRes = pResFirst;
    if (pRes.error && looksLikeMissingColumnError(pRes.error, 'plano_url')) {
      pRes = await fetchAllPropertiesRows(PROPERTIES_SELECT_WITHOUT_PLANO, orderCol, false);
    }
    if (pRes.error && looksLikeMissingColumnError(pRes.error, 'price_currency')) {
      pRes = await fetchAllPropertiesRows(PROPERTIES_SELECT_LEGACY, orderCol, false);
    }
    if (pRes.error) {
      toast.error('No se pudieron cargar propiedades: ' + pRes.error.message);
      setProperties([]);
      setBarrios((nRes.data ?? []).map((x: any) => ({ id: x.id, name: x.nombre })));
      setPropertyTypes([]);
      setLoading(false);
      return;
    }
    const tRes = await osorio.from('property_types').select('id, nombre').order('nombre');

    const barrioMap = Object.fromEntries((nRes.data ?? []).map((n: any) => [n.id, n.nombre]));
    const typeMap = Object.fromEntries((tRes.data ?? []).map((t: any) => [t.id, t.nombre]));

    const cur = (v: unknown): PriceCurrency => (v === 'USD' ? 'USD' : 'PYG');

    const rows = (pRes.data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price != null ? Number(p.price) : 0,
      price_currency: cur(p.price_currency),
      barrio: barrioMap[p.barrio_id] ?? '—',
      property_type: typeMap[p.property_type_id] ?? '—',
      operation_type: p.operation_type,
      status: p.status,
      bedrooms: p.bedrooms != null ? Number(p.bedrooms) : null,
      bathrooms: p.bathrooms != null ? Number(p.bathrooms) : null,
      area_m2: p.area_m2 != null ? Number(p.area_m2) : null,
      quote_count: p.quote_count != null ? Number(p.quote_count) : 0,
      created_at: p.created_at,
    }));

    const ordered =
      sortBy === 'price'
        ? [...rows].sort(
            (a, b) =>
              priceToComparablePyg(a.price, a.price_currency) -
              priceToComparablePyg(b.price, b.price_currency)
          )
        : rows;

    setProperties(ordered);
    setBarrios((nRes.data ?? []).map((x: any) => ({ id: x.id, name: x.nombre })));
    setPropertyTypes((tRes.data ?? []).map((x: any) => ({ id: x.id, name: x.nombre })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile, sortBy]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setSearch(q);
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    const { error } = await osorio.from('properties').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar: ' + error.message);
    } else {
      toast.success('Propiedad eliminada');
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  const filtered = properties.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      const nName = p.barrio.toLowerCase();
      if (!p.title.toLowerCase().includes(s) && !nName.includes(s)) return false;
    }
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterType && p.property_type !== filterType) return false;
    if (filterOp && p.operation_type !== filterOp) return false;
    return true;
  });

  const uniqueTypes = [...new Set(properties.map(p => p.property_type).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1">Administración</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">Propiedades</h1>
          </div>
          <Link
            to="/admin/properties/new"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-sans font-medium shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Propiedad
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título o barrio..."
              className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
            />
          </div>
          <div className="min-w-[170px]">
            <StyledSelect icon={Filter} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{t('admin.filters.all_statuses')}</option>
              <option value="disponible">{t('estado.disponible')}</option>
              <option value="alquilado">{t('estado.alquilado')}</option>
              <option value="vendido">{t('estado.vendido')}</option>
            </StyledSelect>
          </div>
          <div className="min-w-[180px]">
            <StyledSelect icon={Building2} value={filterOp} onChange={e => setFilterOp(e.target.value)}>
              <option value="">{t('admin.filters.all_ops')}</option>
              <option value="venta">{t('op.venta')}</option>
              <option value="alquiler">{t('op.alquiler')}</option>
            </StyledSelect>
          </div>
          <div className="min-w-[160px]">
            <StyledSelect value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">{t('admin.filters.all_types')}</option>
              {uniqueTypes.map(typeName => (
                <option key={typeName} value={typeName}>{typeName}</option>
              ))}
            </StyledSelect>
          </div>
          <div className="min-w-[160px]">
            <StyledSelect icon={ArrowUpDown} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="created_at">{t('properties.sort.newest')}</option>
              <option value="quote_count">{t('properties.sort.quotes')}</option>
              <option value="price">{t('admin.sort.price')}</option>
            </StyledSelect>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Building2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No hay propiedades</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Barrio</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Operación</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Estado</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Caract.</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cotiz.</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><p className="font-medium text-foreground truncate max-w-[200px]">{p.title}</p></td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.barrio}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize hidden lg:table-cell">{p.property_type}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize hidden lg:table-cell">{p.operation_type}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                        {formatPropertyPrice(p.price ?? 0, p.price_currency, p.operation_type === 'alquiler')}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'disponible' ? 'badge-disponible' : p.status === 'vendido' ? 'badge-vendido' : 'badge-alquilado'}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          {p.bedrooms != null && <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                          {p.bathrooms != null && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                          {p.area_m2 != null && <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{p.area_m2}m²</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className="flex items-center justify-center gap-1 text-xs text-primary font-medium"><MessageSquare className="w-3 h-3" />{p.quote_count ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/properties/${p.id}/edit`} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará "{p.title}" permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
