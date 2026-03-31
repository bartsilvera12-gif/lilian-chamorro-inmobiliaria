import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { osorio } from "@/lib/supabase";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Check, Search, Star } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

interface TestimonialRow {
  id: string;
  review_es: string;
  stars: number;
  sort_order: number;
  is_active: boolean;
}

interface FormData {
  review_es: string;
  stars: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm: FormData = {
  review_es: "",
  stars: "5",
  sort_order: "0",
  is_active: true,
};

export default function AdminTestimonialsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await osorio
      .from("testimonials")
      .select("id, review_es, stars, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar reseñas: " + error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as TestimonialRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (row: TestimonialRow) => {
    setForm({
      review_es: row.review_es ?? "",
      stars: String(row.stars ?? 5),
      sort_order: String(row.sort_order ?? 0),
      is_active: row.is_active,
    });
    setEditingId(row.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.review_es.trim()) {
      toast.error("La reseña es obligatoria");
      return;
    }

    const stars = Math.max(1, Math.min(5, Number(form.stars) || 5));
    setSaving(true);
    const payload = {
      review_es: form.review_es.trim(),
      stars,
      sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
      is_active: form.is_active,
    };

    let error: any;
    if (editingId) {
      ({ error } = await osorio.from("testimonials").update(payload).eq("id", editingId));
    } else {
      ({ error } = await osorio.from("testimonials").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }

    toast.success(editingId ? "Reseña actualizada" : "Reseña creada");
    closeForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await osorio.from("testimonials").delete().eq("id", id);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }
    toast.success("Reseña eliminada");
    fetchData();
  };

  const filtered = items.filter((it) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return it.review_es.toLowerCase().includes(q);
  });

  const inputCls =
    "w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40";
  const areaCls =
    "w-full min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Reseñas</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Reseña
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar reseña..."
            className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all hover:border-primary/40"
          />
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">{editingId ? "Editar Reseña" : "Nueva Reseña"}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Estrellas (1 a 5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.stars}
                  onChange={(e) => setForm((prev) => ({ ...prev, stars: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Orden</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="accent-primary"
                  />
                  Activo
                </label>
              </div>
              <div className="lg:col-span-3">
                <label className={labelCls}>Reseña *</label>
                <textarea
                  value={form.review_es}
                  onChange={(e) => setForm((prev) => ({ ...prev, review_es: e.target.value }))}
                  className={areaCls}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={closeForm} className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.97] transition-all"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingId ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Star className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No hay reseñas cargadas</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reseña</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Estrellas</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Orden</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-foreground max-w-xl">
                        <p className="line-clamp-2">{row.review_es}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{row.stars}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{row.sort_order}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.is_active ? "badge-disponible" : "bg-muted text-muted-foreground"}`}>
                          {row.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(row)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
                                <AlertDialogDescription>Este cambio no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(row.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
      </div>
    </AdminLayout>
  );
}

