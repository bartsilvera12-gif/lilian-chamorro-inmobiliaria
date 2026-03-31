export type PropertyPriceCurrency = 'USD' | 'PYG';

export interface Property {
  id: string;
  // El panel admin original usaba multi-tenant por store_id.
  // En el flujo actual conectado a osorio_inmuebles, store_id puede no existir.
  store_id?: string;
  title: string;
  description: string;
  price: number;
  /** Moneda en que está expresado `price` (columna `price_currency` en BD). */
  price_currency?: PropertyPriceCurrency;
  barrio: string;
  // Tipo de propiedad (proviene de `property_types.nombre`).
  tipo: string;
  // Estado (proviene de `properties.status`).
  estado: string;
  operacion: 'venta' | 'alquiler' | string;

  // Para estados con fechas (por ahora el UI solo muestra para "disponible").
  disponibilidad_desde?: string;
  disponibilidad_hasta?: string;

  // Se obtiene parseando `location_url` (Google Maps).
  lat?: number;
  lng?: number;

  location_url?: string;
  main_image: string;
  quote_count: number;
  created_at?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_m2?: number;
}

export interface PropertyImage {
  id: string;
  store_id?: string;
  // En el modelo nuevo: `property_id`.
  product_id?: string;
  property_id?: string;
  image_url: string;
  is_primary: boolean;
  // En el modelo nuevo: `sort_order`.
  order?: number;
  sort_order?: number;
}

export interface Quote {
  id: string;
  store_id?: string;
  product_id?: string;
  property_id?: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  created_at: string;
}

export interface Neighborhood {
  id: string;
  store_id?: string;
  name: string;

  // Modelo nuevo (osorio_inmuebles.barrios)
  coeficiente?: number;
  precio_m2_min?: number;
  precio_m2_max?: number;

  // Modelo previo (mockData)
  price_m2?: number;
  min_factor?: number;
  max_factor?: number;
}
