import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { osorio } from '@/lib/supabase';
import { fetchAllPropertiesRows } from '@/lib/osorioRepository';
import AdminLayout from '@/components/admin/AdminLayout';
import StyledSelect from '@/components/ui/StyledSelect';
import { MessageSquare, Loader2, Phone, Mail, Building2, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QuoteRow {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  mensaje: string | null;
  created_at: string;
  property_id: string;
}

interface PropertyMinimal { id: string; title: string; }

export default function AdminQuotesPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [properties, setProperties] = useState<PropertyMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '', email: '', mensaje: '' });

  const refresh = async () => {
    setLoading(true);
    const [qRes, pRes] = await Promise.all([
      osorio
        .from('quotes')
        .select('id, nombre, email, telefono, mensaje, created_at, property_id')
        .order('created_at', { ascending: false }),
      fetchAllPropertiesRows('id, title', 'title', true),
    ]);
    setQuotes(qRes.data ?? []);
    setProperties((pRes.data ?? []) as { id: string; title: string }[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [profile]);

  const filtered = quotes.filter(q => {
    if (filterProperty && q.property_id !== filterProperty) return false;
    return true;
  });
  const propMap = Object.fromEntries(properties.map(p => [p.id, p.title]));

  const openEdit = (q: QuoteRow) => {
    setEditId(q.id);
    setEditForm({
      nombre: q.nombre ?? '',
      telefono: q.telefono ?? '',
      email: q.email ?? '',
      mensaje: q.mensaje ?? '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const payload = {
      nombre: editForm.nombre.trim(),
      telefono: editForm.telefono.trim() || null,
      email: editForm.email.trim() || null,
      mensaje: editForm.mensaje.trim() || null,
    };

    const { error } = await osorio.from('quotes').update(payload).eq('id', editId);
    if (error) return;
    setEditOpen(false);
    setEditId(null);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    const { error } = await osorio.from('quotes').delete().eq('id', id);
    if (error) return;
    await refresh();
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-foreground">Cotizaciones</h1>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[220px]">
            <StyledSelect icon={Building2} value={filterProperty} onChange={e => setFilterProperty(e.target.value)}>
              <option value="">{t('admin.filters.all_properties')}</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </StyledSelect>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No hay cotizaciones</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contacto</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Propiedad</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Mensaje</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(q => (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {new Date(q.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br />
                        <span className="text-muted-foreground/60">{new Date(q.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{q.nombre}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {q.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{q.email}</p>}
                          {q.telefono && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{q.telefono}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-primary font-medium truncate max-w-[180px]">{propMap[q.property_id] ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{q.mensaje || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(q)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Editar cotización"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" aria-label="Eliminar cotización">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará la cotización de "{q.nombre}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(q.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Eliminar
                                </AlertDialogAction>
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

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar cotización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
                <input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Teléfono</label>
                  <input
                    value={editForm.telefono}
                    onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Mensaje</label>
                <textarea
                  value={editForm.mensaje}
                  onChange={(e) => setEditForm((p) => ({ ...p, mensaje: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
