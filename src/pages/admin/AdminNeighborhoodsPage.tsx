import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { osorio } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { MapPin, Plus, Pencil, Trash2, Loader2, X, Check, Search } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface BarrioRow {
  id: string;
  nombre: string;
  coeficiente: number;
  precio_m2_min: number;
  precio_m2_max: number;
}

interface FormData {
  nombre: string;
  coeficiente: string;
  precio_m2_min: string;
  precio_m2_max: string;
}

const emptyForm: FormData = {
  nombre: '',
  coeficiente: '1.00',
  precio_m2_min: '',
  precio_m2_max: '',
};

export default function AdminNeighborhoodsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<BarrioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data } = await osorio
      .from('barrios')
      .select('id, nombre, coeficiente, precio_m2_min, precio_m2_max')
      .order('nombre');
    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (n: BarrioRow) => {
    setForm({
      nombre: n.nombre,
      coeficiente: (n.coeficiente ?? 1).toFixed(2),
      precio_m2_min: n.precio_m2_min?.toString() ?? '',
      precio_m2_max: n.precio_m2_max?.toString() ?? '',
    });
    setEditingId(n.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.nombre || !form.precio_m2_min || !form.precio_m2_max || !form.coeficiente) {
      toast.error('Nombre, coeficiente y rango de precio m² son obligatorios');
      return;
    }
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      coeficiente: parseFloat(form.coeficiente),
      precio_m2_min: parseFloat(form.precio_m2_min),
      precio_m2_max: parseFloat(form.precio_m2_max),
    };

    let error;
    if (editingId) {
      ({ error } = await osorio.from('barrios').update(payload).eq('id', editingId));
    } else {
      ({ error } = await osorio.from('barrios').insert(payload));
    }
    setSaving(false);

    if (error) toast.error('Error: ' + error.message);
    else { toast.success(editingId ? 'Barrio actualizado' : 'Barrio creado'); closeForm(); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await osorio.from('barrios').delete().eq('id', id);
    if (error) toast.error('Error: ' + error.message);
    else { toast.success('Barrio eliminado'); fetchData(); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filtered = items.filter(n => !search || n.nombre.toLowerCase().includes(search.toLowerCase()));
  const inputCls = 'w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40';
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Barrios</h1>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all">
            <Plus className="w-4 h-4" />Nuevo Barrio
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar barrio..." className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40" />
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Editar Barrio' : 'Nuevo Barrio'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Nombre *</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                        <label className={labelCls}>Coeficiente C_ciudad *</label>
                        <input name="coeficiente" type="number" step="0.01" value={form.coeficiente} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                        <label className={labelCls}>Precio m² mínimo (USD) *</label>
                        <input name="precio_m2_min" type="number" step="0.01" value={form.precio_m2_min} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                        <label className={labelCls}>Precio m² máximo (USD) *</label>
                        <input name="precio_m2_max" type="number" step="0.01" value={form.precio_m2_max} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={closeForm} className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.97] transition-all">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <MapPin className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No hay barrios configurados</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">C_ciudad</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio m² (USD)</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(n => (
                    <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{n.nombre}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap hidden sm:table-cell">{n.coeficiente.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">USD {n.precio_m2_min} – {n.precio_m2_max}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(n)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar barrio?</AlertDialogTitle>
                                <AlertDialogDescription>Se eliminará "{n.nombre}" permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(n.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
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
