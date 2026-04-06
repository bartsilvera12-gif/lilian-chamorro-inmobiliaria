import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { osorio } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { MapPinned, Plus, Pencil, Trash2, Loader2, Check, Search } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface CiudadRow {
  id: string;
  nombre: string;
}

export default function AdminCitiesPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<CiudadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await osorio.from('ciudades').select('id, nombre').order('nombre');
    if (error) {
      toast.error('No se pudieron cargar ciudades: ' + error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as CiudadRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, [profile]);

  const openCreate = () => {
    setNombre('');
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: CiudadRow) => {
    setNombre(c.nombre);
    setEditingId(c.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const name = nombre.trim();
    if (!name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    let error;
    if (editingId) {
      ({ error } = await osorio.from('ciudades').update({ nombre: name }).eq('id', editingId));
    } else {
      ({ error } = await osorio.from('ciudades').insert({ nombre: name }));
    }
    setSaving(false);
    if (error) toast.error('Error: ' + error.message);
    else {
      toast.success(editingId ? 'Ciudad actualizada' : 'Ciudad creada');
      closeForm();
      void fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await osorio.from('ciudades').delete().eq('id', id);
    if (error) toast.error('Error: ' + error.message);
    else {
      toast.success('Ciudad eliminada');
      void fetchData();
    }
  };

  const filtered = items.filter((c) => !search || c.nombre.toLowerCase().includes(search.toLowerCase()));
  const inputCls = 'w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40';
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Ciudades</h1>
          <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all">
            <Plus className="w-4 h-4" />Nueva ciudad
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ciudad..." className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40" />
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-md">
            <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Editar ciudad' : 'Nueva ciudad'}</h2>
            <div>
              <label className={labelCls}>Nombre *</label>
              <input name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={closeForm} className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">Cancelar</button>
              <button type="button" onClick={() => void handleSave()} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.97] transition-all">
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
            <MapPinned className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No hay ciudades configuradas</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{c.nombre}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button type="button" className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar ciudad?</AlertDialogTitle>
                                <AlertDialogDescription>Se eliminará &quot;{c.nombre}&quot;. Los barrios asociados deben reasignarse antes si aplica.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
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
