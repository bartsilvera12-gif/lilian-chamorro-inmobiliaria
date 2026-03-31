import { osorio } from "@/lib/supabase";
import { parseLatLngFromGoogleMapsUrl, resolveShortGoogleMapsUrls } from "@/lib/googleMapsUrl";
import type { Property } from "@/types/property";
import { isPriceCurrency, type PriceCurrency } from "@/lib/currency";
import { MOCK_PROPERTIES, MOCK_NEIGHBORHOODS, TIPOS } from "@/data/mockData";

function logDbError(context: string, error: any) {
  // eslint-disable-next-line no-console
  console.error(`[Supabase][${context}]`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
  });
}

/** Columnas de `properties` para lectura pública/admin (exportadas para el listado admin). */
export const PROPERTIES_SELECT_FULL =
  "id,title,description,price,price_currency,operation_type,status,available_from,available_to,bedrooms,bathrooms,area_m2,barrio_id,property_type_id,location_url,quote_count,created_at";

export const PROPERTIES_SELECT_LEGACY =
  "id,title,description,price,operation_type,status,available_from,available_to,bedrooms,bathrooms,area_m2,barrio_id,property_type_id,location_url,quote_count,created_at";

export function looksLikeMissingColumnError(err: unknown, column: string): boolean {
  const blob = `${(err as { message?: string })?.message ?? ""} ${(err as { details?: string })?.details ?? ""} ${(err as { hint?: string })?.hint ?? ""}`.toLowerCase();
  const c = column.toLowerCase();
  if (!blob.includes(c)) return false;
  return (
    blob.includes("does not exist") ||
    blob.includes("could not find") ||
    blob.includes("no existe") ||
    blob.includes("42703")
  );
}

/**
 * Filas por petición al paginar `properties`.
 * PostgREST self-hosted suele usar max-rows = 100; si pedís más, igual solo devuelve 100
 * y el código antiguo cortaba ahí. Por eso el default es 100; subilo si tu API permite más.
 */
const PROPERTIES_PAGE_STEP = Math.max(
  25,
  Math.min(1000, Number(import.meta.env.VITE_SUPABASE_PAGE_SIZE) || 500)
);

const IN_CLAUSE_CHUNK = 100;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Todas las filas de `properties` con el select indicado (varias páginas `.range`).
 */
export async function fetchAllPropertiesRows(
  selectList: string,
  orderColumn: string,
  orderAscending: boolean
): Promise<{ data: any[] | null; error: any }> {
  const rows: any[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await osorio
      .from("properties")
      .select(selectList)
      .order(orderColumn, { ascending: orderAscending })
      .range(offset, offset + PROPERTIES_PAGE_STEP - 1);
    if (error) return { data: null, error };
    const batch = data ?? [];
    if (batch.length === 0) break;
    rows.push(...batch);
    offset += batch.length;
    // No cortar por batch.length < STEP: PostgREST puede capar (p. ej. 100) aunque pidamos 500.
  }
  return { data: rows, error: null };
}

function fallbackPropertyTypesSelect() {
  return (TIPOS as readonly string[]).map((name) => ({
    id: name,
    name,
  }));
}

function fallbackNeighborhoodsSelect() {
  return MOCK_NEIGHBORHOODS.map((b) => ({
    id: b.id as string,
    name: b.name,
  }));
}

function fallbackCalculatorInputs() {
  return {
    barrios: MOCK_NEIGHBORHOODS.map((b) => ({
      id: b.id as string,
      nombre: b.name,
      // La DB usa `coeficiente`; en mock tenemos un rango, usamos el promedio.
      coeficiente:
        typeof b.min_factor === "number" && typeof b.max_factor === "number"
          ? (b.min_factor + b.max_factor) / 2
          : 1,
    })),
    types: (TIPOS as readonly string[]).map((t) => ({
      id: t,
      nombre: t,
      coeficiente: 1,
    })),
  };
}

function fallbackPropertyById(id: string) {
  return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

export { parseLatLngFromGoogleMapsUrl } from "@/lib/googleMapsUrl";

async function fetchBarriosMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const map = new Map<string, string>();
  try {
    for (const chunk of chunkArray(ids, IN_CLAUSE_CHUNK)) {
      const { data, error } = await osorio.from("barrios").select("id, nombre").in("id", chunk);
      if (error) {
        logDbError("fetchBarriosMap", error);
        return new Map<string, string>();
      }
      for (const b of data ?? []) map.set(b.id as string, b.nombre as string);
    }
    return map;
  } catch (e) {
    logDbError("fetchBarriosMap", e);
    return new Map<string, string>();
  }
}

async function fetchPropertyTypesMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const map = new Map<string, string>();
  try {
    for (const chunk of chunkArray(ids, IN_CLAUSE_CHUNK)) {
      const { data, error } = await osorio.from("property_types").select("id, nombre").in("id", chunk);
      if (error) {
        logDbError("fetchPropertyTypesMap", error);
        return new Map<string, string>();
      }
      for (const t of data ?? []) map.set(t.id as string, t.nombre as string);
    }
    return map;
  } catch (e) {
    logDbError("fetchPropertyTypesMap", e);
    return new Map<string, string>();
  }
}

async function fetchMainImagesMap(propertyIds: string[]) {
  if (propertyIds.length === 0) return new Map<string, string>();

  try {
    const byProp = new Map<
      string,
      Array<{ url: string; is_primary: boolean; sort_order: number }>
    >();

    for (const chunk of chunkArray(propertyIds, IN_CLAUSE_CHUNK)) {
      const { data, error } = await osorio
        .from("property_images")
        .select("property_id, image_url, is_primary, sort_order")
        .in("property_id", chunk);
      if (error) {
        logDbError("fetchMainImagesMap", error);
        return new Map<string, string>();
      }
      for (const row of data ?? []) {
        const pid = row.property_id as string;
        const list = byProp.get(pid) ?? [];
        list.push({
          url: row.image_url as string,
          is_primary: Boolean(row.is_primary),
          sort_order: toNumber(row.sort_order),
        });
        byProp.set(pid, list);
      }
    }

    const main = new Map<string, string>();
    for (const [pid, imgs] of byProp.entries()) {
      const primary = imgs.find((i) => i.is_primary);
      if (primary) main.set(pid, primary.url);
      else {
        imgs.sort((a, b) => a.sort_order - b.sort_order);
        main.set(pid, imgs[0]?.url);
      }
    }
    return main;
  } catch (e) {
    logDbError("fetchMainImagesMap", e);
    return new Map<string, string>();
  }
}

function mapToPropertyViewModel(args: {
  id: string;
  title: string;
  description: string | null;
  price: unknown;
  price_currency?: unknown;
  barrio: string | undefined;
  tipo: string | undefined;
  status: string;
  operation_type: string;
  available_from: string | null;
  available_to: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: unknown;
  location_url: string | null;
  /** URL ya expandida (p. ej. goo.gl → google.com/maps/.../@lat,lng) solo para lat/lng */
  location_url_for_coords?: string | null;
  main_image: string | undefined;
  quote_count: unknown;
  created_at?: string | null;
}): Property {
  const coordSource = args.location_url_for_coords ?? args.location_url;
  const latLng = coordSource ? parseLatLngFromGoogleMapsUrl(coordSource) : null;
  const price_currency: PriceCurrency = isPriceCurrency(args.price_currency)
    ? args.price_currency
    : "PYG";

  return {
    id: args.id,
    title: args.title,
    description: args.description ?? "",
    price: toNumber(args.price),
    price_currency,
    barrio: args.barrio ?? "",
    tipo: args.tipo ?? "",
    estado: args.status,
    operacion: args.operation_type,
    disponibilidad_desde: args.available_from ?? undefined,
    disponibilidad_hasta: args.available_to ?? undefined,
    lat: latLng?.lat,
    lng: latLng?.lng,
    location_url: args.location_url ?? undefined,
    main_image: args.main_image ?? "",
    quote_count: toNumber(args.quote_count),
    created_at: args.created_at ?? undefined,
    bedrooms: args.bedrooms ?? undefined,
    bathrooms: args.bathrooms ?? undefined,
    area_m2: args.area_m2 ? toNumber(args.area_m2) : undefined,
  };
}

export async function fetchPublicProperties() {
  try {
    let { data, error } = await fetchAllPropertiesRows(
      PROPERTIES_SELECT_FULL,
      "id",
      true
    );
    if (error && looksLikeMissingColumnError(error, "price_currency")) {
      // eslint-disable-next-line no-console
      console.warn(
        "[osorioRepository] Columna price_currency ausente; reintentando sin ella. Ejecutá la migración SQL en Supabase."
      );
      const second = await fetchAllPropertiesRows(PROPERTIES_SELECT_LEGACY, "id", true);
      data = second.data;
      error = second.error;
    }
    if (error) {
      logDbError("fetchPublicProperties", error);
      // eslint-disable-next-line no-console
      console.warn(
        "[osorioRepository] fetchPublicProperties falló → se muestran datos MOCK. Revisá: schema en API Exposed schemas, RLS, URL/anon key, consola red."
      );
      return MOCK_PROPERTIES;
    }
    const props = data ?? [];
    if (props.length === 0) return [];

    const barrioIds = Array.from(new Set(props.map((p) => p.barrio_id as string).filter(Boolean)));
    const typeIds = Array.from(new Set(props.map((p) => p.property_type_id as string).filter(Boolean)));
    const propertyIds = props.map((p) => p.id as string);

    const [barrioMap, typeMap, imagesMap, shortMapsResolved] = await Promise.all([
      fetchBarriosMap(barrioIds),
      fetchPropertyTypesMap(typeIds),
      fetchMainImagesMap(propertyIds),
      resolveShortGoogleMapsUrls(props.map((p) => p.location_url as string | null)),
    ]);

    return props.map((p) => {
      const loc = p.location_url as string | null;
      const forCoords = loc ? shortMapsResolved.get(loc) ?? loc : null;
      return mapToPropertyViewModel({
        id: p.id as string,
        title: p.title as string,
        description: p.description as string | null,
        price: p.price,
        price_currency: (p as { price_currency?: unknown }).price_currency,
        barrio: barrioMap.get(p.barrio_id as string),
        tipo: typeMap.get(p.property_type_id as string),
        status: p.status as string,
        operation_type: p.operation_type as string,
        available_from: p.available_from as string | null,
        available_to: p.available_to as string | null,
        bedrooms: (p.bedrooms as number | null) ?? null,
        bathrooms: (p.bathrooms as number | null) ?? null,
        area_m2: p.area_m2,
        location_url: loc,
        location_url_for_coords: forCoords,
        main_image: imagesMap.get(p.id as string),
        quote_count: p.quote_count,
        created_at: p.created_at as string | null | undefined,
      });
    });
  } catch (e) {
    logDbError("fetchPublicProperties", e);
    return MOCK_PROPERTIES;
  }
}

export async function fetchTopQuotedProperties(limit: number) {
  try {
    let { data, error } = await osorio
      .from("properties")
      .select(PROPERTIES_SELECT_FULL)
      .order("quote_count", { ascending: false })
      .limit(limit);
    if (error && looksLikeMissingColumnError(error, "price_currency")) {
      const second = await osorio
        .from("properties")
        .select(PROPERTIES_SELECT_LEGACY)
        .order("quote_count", { ascending: false })
        .limit(limit);
      data = second.data as any;
      error = second.error;
    }
    if (error) {
      logDbError("fetchTopQuotedProperties", error);
      return [...MOCK_PROPERTIES]
        .sort((a, b) => b.quote_count - a.quote_count)
        .slice(0, limit);
    }

    // Reutilizamos el mapeo completo para mantener coherencia (incluye main image).
    const props = data ?? [];
    if (props.length === 0) return [];
    const barrioIds = Array.from(new Set(props.map((p) => p.barrio_id as string).filter(Boolean)));
    const typeIds = Array.from(new Set(props.map((p) => p.property_type_id as string).filter(Boolean)));
    const propertyIds = props.map((p) => p.id as string);

    const [barrioMap, typeMap, imagesMap, shortMapsResolved] = await Promise.all([
      fetchBarriosMap(barrioIds),
      fetchPropertyTypesMap(typeIds),
      fetchMainImagesMap(propertyIds),
      resolveShortGoogleMapsUrls(props.map((p) => p.location_url as string | null)),
    ]);

    return props.map((p) => {
      const loc = p.location_url as string | null;
      const forCoords = loc ? shortMapsResolved.get(loc) ?? loc : null;
      return mapToPropertyViewModel({
        id: p.id as string,
        title: p.title as string,
        description: p.description as string | null,
        price: p.price,
        price_currency: (p as { price_currency?: unknown }).price_currency,
        barrio: barrioMap.get(p.barrio_id as string),
        tipo: typeMap.get(p.property_type_id as string),
        status: p.status as string,
        operation_type: p.operation_type as string,
        available_from: p.available_from as string | null,
        available_to: p.available_to as string | null,
        bedrooms: (p.bedrooms as number | null) ?? null,
        bathrooms: (p.bathrooms as number | null) ?? null,
        area_m2: p.area_m2,
        location_url: loc,
        location_url_for_coords: forCoords,
        main_image: imagesMap.get(p.id as string),
        quote_count: p.quote_count,
        created_at: p.created_at as string | null | undefined,
      });
    });
  } catch (e) {
    logDbError("fetchTopQuotedProperties", e);
    return [...MOCK_PROPERTIES]
      .sort((a, b) => b.quote_count - a.quote_count)
      .slice(0, limit);
  }
}

export async function fetchPropertyById(id: string) {
  try {
    let { data, error } = await osorio
      .from("properties")
      .select(PROPERTIES_SELECT_FULL)
      .eq("id", id)
      .single();

    if (error && looksLikeMissingColumnError(error, "price_currency")) {
      const second = await osorio
        .from("properties")
        .select(PROPERTIES_SELECT_LEGACY)
        .eq("id", id)
        .single();
      data = second.data as any;
      error = second.error;
    }

    if (error) {
      logDbError("fetchPropertyById", error);
      return fallbackPropertyById(id);
    }
    if (!data) return null;

    const loc = data.location_url as string | null;
    const [barrioMap, typeMap, imagesMap, shortMapsResolved] = await Promise.all([
      fetchBarriosMap([data.barrio_id as string]),
      fetchPropertyTypesMap([data.property_type_id as string]),
      fetchMainImagesMap([data.id as string]),
      resolveShortGoogleMapsUrls([loc]),
    ]);
    const forCoords = loc ? shortMapsResolved.get(loc) ?? loc : null;

    return mapToPropertyViewModel({
      id: data.id as string,
      title: data.title as string,
      description: data.description as string | null,
      price: data.price,
      price_currency: (data as { price_currency?: unknown }).price_currency,
      barrio: barrioMap.get(data.barrio_id as string),
      tipo: typeMap.get(data.property_type_id as string),
      status: data.status as string,
      operation_type: data.operation_type as string,
      available_from: data.available_from as string | null,
      available_to: data.available_to as string | null,
      bedrooms: (data.bedrooms as number | null) ?? null,
      bathrooms: (data.bathrooms as number | null) ?? null,
      area_m2: data.area_m2,
      location_url: loc,
      location_url_for_coords: forCoords,
      main_image: imagesMap.get(data.id as string),
      quote_count: data.quote_count,
      created_at: data.created_at as string | null | undefined,
    });
  } catch (e) {
    logDbError("fetchPropertyById", e);
    return fallbackPropertyById(id);
  }
}

export async function fetchPropertyImagesById(propertyId: string) {
  try {
    const { data, error } = await osorio
      .from("property_images")
      .select("image_url,is_primary,sort_order")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });
    if (error) {
      logDbError("fetchPropertyImagesById", error);
      const p = fallbackPropertyById(propertyId);
      if (!p?.main_image) return [];
      return [{ image_url: p.main_image, is_primary: true }];
    }
    return (data ?? []).map((r) => ({
      image_url: r.image_url as string,
      is_primary: Boolean(r.is_primary),
    }));
  } catch (e) {
    logDbError("fetchPropertyImagesById", e);
    const p = fallbackPropertyById(propertyId);
    if (!p?.main_image) return [];
    return [{ image_url: p.main_image, is_primary: true }];
  }
}

export async function fetchNeighborhoodsForSelect() {
  try {
    const { data, error } = await osorio
      .from("barrios")
      .select("id, nombre")
      .order("nombre");
    if (error) {
      logDbError("fetchNeighborhoodsForSelect", error);
      return fallbackNeighborhoodsSelect();
    }
    if (!data || data.length === 0) return [];
    return (data ?? []).map((b: any) => ({ id: b.id as string, name: b.nombre as string }));
  } catch (e) {
    logDbError("fetchNeighborhoodsForSelect", e);
    return fallbackNeighborhoodsSelect();
  }
}

export async function fetchPropertyTypesForSelect() {
  try {
    const { data, error } = await osorio
      .from("property_types")
      .select("id, nombre")
      .order("nombre");
    if (error) {
      logDbError("fetchPropertyTypesForSelect", error);
      return fallbackPropertyTypesSelect();
    }
    if (!data || data.length === 0) return [];
    return (data ?? []).map((t: any) => ({ id: t.id as string, name: t.nombre as string }));
  } catch (e) {
    logDbError("fetchPropertyTypesForSelect", e);
    return fallbackPropertyTypesSelect();
  }
}

export async function fetchCalculatorInputs() {
  try {
    const [barriosRes, typesRes] = await Promise.all([
      osorio.from("barrios").select("id, nombre, coeficiente").order("nombre"),
      osorio.from("property_types").select("id, nombre, coeficiente").order("nombre"),
    ]);

    if (barriosRes.error || typesRes.error) {
      logDbError("fetchCalculatorInputs", barriosRes.error ?? typesRes.error);
      return fallbackCalculatorInputs();
    }
    return {
      barrios: (barriosRes.data ?? []).map((b: any) => ({
        id: b.id as string,
        nombre: b.nombre as string,
        coeficiente: toNumber(b.coeficiente),
      })),
      types: (typesRes.data ?? []).map((t: any) => ({
        id: t.id as string,
        nombre: t.nombre as string,
        coeficiente: toNumber(t.coeficiente),
      })),
    };
  } catch (e) {
    logDbError("fetchCalculatorInputs", e);
    return fallbackCalculatorInputs();
  }
}

export async function insertQuote(payload: {
  property_id: string;
  nombre: string;
  telefono: string;
  email: string;
  mensaje?: string;
}) {
  const { error } = await osorio.from("quotes").insert(payload);
  return error;
}

export async function insertCalculatorLog(payload: {
  barrio_id: string;
  tipo_propiedad_id: string;
  superficie: number;
  tipo_calle: "asfalto" | "empedrado" | "tierra";
  cerca_arroyo: boolean;
  urgencia: "apurado" | "no_apurado";
  resultado_precio: number;
}) {
  const { error } = await osorio.from("calculator_logs").insert({
    ...payload,
    // Supabase acepta booleanos y enums por check; si tus columnas son text, igual funciona.
  });
  return error;
}

export async function fetchTransitionStats() {
  try {
    const [quotesRes, barriosRes] = await Promise.all([
      osorio.from("quotes").select("id", { count: "exact", head: true }),
      osorio.from("barrios").select("id", { count: "exact", head: true }),
    ]);

    if (quotesRes.error || barriosRes.error) {
      logDbError("fetchTransitionStats", quotesRes.error ?? barriosRes.error);
      return {
        quotesCount: 0,
        barriosCount: MOCK_NEIGHBORHOODS.length,
      };
    }

    return {
      quotesCount: quotesRes.count ?? 0,
      barriosCount: barriosRes.count ?? 0,
    };
  } catch (e) {
    logDbError("fetchTransitionStats", e);
    return {
      quotesCount: 0,
      barriosCount: MOCK_NEIGHBORHOODS.length,
    };
  }
}

export interface SuccessCase {
  id: string;
  image_url: string;
  description_es: string;
  sort_order: number;
  is_active: boolean;
}

export async function fetchSuccessCases(limit = 8): Promise<SuccessCase[]> {
  try {
    const { data, error } = await osorio
      .from("success_cases")
      .select("id, image_url, description_es, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logDbError("fetchSuccessCases", error);
      return [];
    }
    return (data ?? []).map((row: any) => ({
      id: row.id as string,
      image_url: row.image_url as string,
      description_es: row.description_es as string,
      sort_order: toNumber(row.sort_order),
      is_active: Boolean(row.is_active),
    }));
  } catch (e) {
    logDbError("fetchSuccessCases", e);
    return [];
  }
}

export interface Testimonial {
  id: string;
  review_es: string;
  stars: number;
  sort_order: number;
  is_active: boolean;
}

export async function fetchTestimonials(limit = 12): Promise<Testimonial[]> {
  try {
    const { data, error } = await osorio
      .from("testimonials")
      .select("id, review_es, stars, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logDbError("fetchTestimonials", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id as string,
      review_es: row.review_es as string,
      stars: Math.max(1, Math.min(5, toNumber(row.stars))),
      sort_order: toNumber(row.sort_order),
      is_active: Boolean(row.is_active),
    }));
  } catch (e) {
    logDbError("fetchTestimonials", e);
    return [];
  }
}

export interface DevelopmentItem {
  id: string;
  image_url: string;
  description_es: string;
  sort_order: number;
  is_active: boolean;
}

export async function fetchDevelopments(limit = 24): Promise<DevelopmentItem[]> {
  try {
    const { data, error } = await osorio
      .from("developments")
      .select("id, image_url, description_es, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logDbError("fetchDevelopments", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id as string,
      image_url: row.image_url as string,
      description_es: row.description_es as string,
      sort_order: toNumber(row.sort_order),
      is_active: Boolean(row.is_active),
    }));
  } catch (e) {
    logDbError("fetchDevelopments", e);
    return [];
  }
}

