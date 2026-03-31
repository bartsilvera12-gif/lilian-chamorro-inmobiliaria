import { useEffect, useState, useCallback } from 'react';
import { osorio, supabase } from '@/lib/supabase';
import { ImagePlus, Trash2, Star, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
}

interface Props {
  propertyId: string;
}

export default function AdminPropertyImagesManager({ propertyId }: Props) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    const { data } = await osorio
      .from('property_images')
      .select('id, image_url, is_primary, sort_order, alt_text')
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: true });
    setImages(data ?? []);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file);
      if (uploadError) {
        toast.error('Error subiendo: ' + uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
      const isPrimary = images.length === 0;
      const nextOrder = images.length;

      await osorio.from('property_images').insert({
        property_id: propertyId,
        image_url: urlData.publicUrl,
        is_primary: isPrimary,
        sort_order: nextOrder,
        alt_text: '',
      });
    }

    setUploading(false);
    toast.success('Imágenes subidas');
    fetchImages();
    e.target.value = '';
  };

  const handleSetPrimary = async (imgId: string) => {
    await osorio.from('property_images').update({ is_primary: false }).eq('property_id', propertyId);
    await osorio.from('property_images').update({ is_primary: true }).eq('id', imgId);
    toast.success('Imagen principal actualizada');
    fetchImages();
  };

  const handleDelete = async (imgId: string) => {
    const { error } = await osorio.from('property_images').delete().eq('id', imgId).eq('property_id', propertyId);
    if (error) toast.error('Error: ' + error.message);
    else { toast.success('Imagen eliminada'); fetchImages(); }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= images.length) return;
    const a = images[index];
    const b = images[swapIndex];
    await Promise.all([
      osorio.from('property_images').update({ sort_order: b.sort_order }).eq('id', a.id),
      osorio.from('property_images').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    fetchImages();
  };

  const handleAltText = async (imgId: string, altText: string) => {
    await osorio.from('property_images').update({ alt_text: altText }).eq('id', imgId).eq('property_id', propertyId);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Imágenes</h2>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer hover:opacity-90 active:scale-[0.97] transition-all">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          Subir imágenes
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : images.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay imágenes. Sube la primera.</p>
      ) : (
        <div className="space-y-3">
          {images.map((img, idx) => (
            <div key={img.id} className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${img.is_primary ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <img src={img.image_url} alt={img.alt_text ?? ''} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  {img.is_primary && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Principal</span>
                  )}
                  <span className="text-xs text-muted-foreground">Orden: {img.sort_order + 1}</span>
                </div>
                <input
                  type="text"
                  defaultValue={img.alt_text ?? ''}
                  onBlur={e => handleAltText(img.id, e.target.value)}
                  placeholder="Texto alternativo (alt)"
                  className="w-full h-8 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => handleReorder(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30" title="Subir">
                  <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleReorder(idx, 'down')} disabled={idx === images.length - 1} className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30" title="Bajar">
                  <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {!img.is_primary && (
                  <button onClick={() => handleSetPrimary(img.id)} className="p-1.5 rounded hover:bg-primary/10 transition-colors" title="Marcar como principal">
                    <Star className="w-3.5 h-3.5 text-primary" />
                  </button>
                )}
                <button onClick={() => handleDelete(img.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
