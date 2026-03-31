/**
 * Traducción automática ES → EN/PT para textos dinámicos (casos de éxito).
 * Usa la API pública MyMemory (sin API key). Caché en memoria por sesión.
 * Si falla o hay límite, se devuelve el texto original en español.
 */

const memoryCache = new Map<string, string>();

const MAX_CHUNK = 450;

function chunkText(text: string): string[] {
  const t = text.trim();
  if (t.length <= MAX_CHUNK) return [t];
  const parts: string[] = [];
  let rest = t;
  while (rest.length > 0) {
    if (rest.length <= MAX_CHUNK) {
      parts.push(rest);
      break;
    }
    let cut = rest.lastIndexOf("\n", MAX_CHUNK);
    if (cut < MAX_CHUNK / 2) cut = rest.lastIndexOf(". ", MAX_CHUNK);
    if (cut < MAX_CHUNK / 2) cut = MAX_CHUNK;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  return parts.filter(Boolean);
}

async function translateChunk(text: string, langPair: "es|en" | "es|pt"): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  const out = data.responseData?.translatedText;
  if (!out || data.responseStatus === 403 || data.responseStatus === 429) throw new Error("translate");
  return out;
}

export async function translateFromEs(text: string, target: "en" | "pt"): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const langPair = target === "en" ? "es|en" : "es|pt";
  const cacheKey = `${langPair}::${trimmed}`;
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey)!;

  try {
    const chunks = chunkText(trimmed);
    const translated = await Promise.all(chunks.map((c) => translateChunk(c, langPair)));
    const result = translated.join("\n\n");
    memoryCache.set(cacheKey, result);
    return result;
  } catch {
    return trimmed;
  }
}
