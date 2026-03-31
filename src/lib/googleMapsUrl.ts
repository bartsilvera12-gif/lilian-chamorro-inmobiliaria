import { supabase } from "@/lib/supabase";

/** Cache en memoria para no repetir invocaciones con el mismo enlace corto. */
const expandedShortUrlCache = new Map<string, string>();

export function parseLatLngFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  const patterns: RegExp[] = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/,
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return null;
}

/** Enlaces cortos sin coordenadas en el texto; requieren seguir el redirect (p. ej. maps.app.goo.gl). */
export function isGoogleMapsShortUrl(url: string): boolean {
  const u = url.trim();
  if (!u.startsWith("http")) return false;
  try {
    const { hostname, pathname } = new URL(u);
    const h = hostname.replace(/^www\./i, "").toLowerCase();
    if (h === "maps.app.goo.gl") return true;
    if (h === "goo.gl" && pathname.startsWith("/maps")) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Expande un enlace corto de Google Maps vía Edge Function (fetch servidor sin CORS).
 * Sin función desplegada devuelve null.
 */
export async function expandGoogleMapsShortUrl(url: string): Promise<string | null> {
  const key = url.trim();
  if (!key) return null;
  const hit = expandedShortUrlCache.get(key);
  if (hit) return hit;

  try {
    const { data, error } = await supabase.functions.invoke("expand-google-maps-url", {
      body: { url: key },
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[googleMapsUrl] expand-google-maps-url:", error.message ?? error);
      return null;
    }
    const expandedUrl = (data as { expandedUrl?: unknown })?.expandedUrl;
    if (typeof expandedUrl !== "string" || !expandedUrl.startsWith("http")) return null;
    expandedShortUrlCache.set(key, expandedUrl);
    return expandedUrl;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[googleMapsUrl] expand-google-maps-url:", e);
    return null;
  }
}

/** Mapa url guardada → url expandida (solo entradas que se pudieron resolver y contienen coords). */
export async function resolveShortGoogleMapsUrls(
  urls: ReadonlyArray<string | null | undefined>
): Promise<Map<string, string>> {
  const need = new Set<string>();
  for (const raw of urls) {
    const u = raw?.trim();
    if (!u) continue;
    if (parseLatLngFromGoogleMapsUrl(u)) continue;
    if (isGoogleMapsShortUrl(u)) need.add(u);
  }
  const out = new Map<string, string>();
  await Promise.all(
    [...need].map(async (u) => {
      const expanded = await expandGoogleMapsShortUrl(u);
      if (expanded && parseLatLngFromGoogleMapsUrl(expanded)) out.set(u, expanded);
    })
  );
  return out;
}
