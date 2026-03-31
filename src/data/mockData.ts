import { Property, Neighborhood } from '@/types/property';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1', store_id: 'osorio-eas', title: 'Casa moderna en Villa Morra',
    description: 'Amplia casa de 3 plantas con jardín, piscina y acabados de primera calidad. Ubicada en una de las zonas más exclusivas de Asunción.',
    price: 2080500000, barrio: 'Villa Morra', tipo: 'casa', estado: 'disponible',
    lat: -25.2867, lng: -57.5802, main_image: 'https://res.cloudinary.com/drupicep5/image/upload/v1774017336/9f111838-9deb-4fc2-aad1-9ec31c1ad83c.png', quote_count: 47,
    bedrooms: 4, bathrooms: 3, area_m2: 320, operacion: 'venta',
  },
  {
    id: '2', store_id: 'osorio-eas', title: 'Departamento en Carmelitas',
    description: 'Departamento de 2 dormitorios con vista panorámica, balcón amplio y estacionamiento cubierto. Edificio con seguridad 24hs.',
    price: 8760000, barrio: 'Carmelitas', tipo: 'departamento', estado: 'disponible',
    lat: -25.2920, lng: -57.5760, main_image: 'https://res.cloudinary.com/drupicep5/image/upload/v1774017184/fe22ea26-c26a-40b4-8c86-be735da83311.png', quote_count: 34,
    bedrooms: 2, bathrooms: 1, area_m2: 85, operacion: 'alquiler',
  },
  {
    id: '3', store_id: 'osorio-eas', title: 'Terreno en Luque',
    description: 'Terreno plano ideal para desarrollo residencial. Zona en crecimiento con excelente conectividad vial.',
    price: 693500000, barrio: 'Luque', tipo: 'terreno', estado: 'disponible',
    lat: -25.2700, lng: -57.4870, main_image: 'https://res.cloudinary.com/drupicep5/image/upload/v1774017361/15b17e6b-c551-4aeb-8f33-5106e3628fba.png', quote_count: 21,
    area_m2: 600, operacion: 'venta',
  },
  {
    id: '4', store_id: 'osorio-eas', title: 'Oficina en el centro',
    description: 'Oficina corporativa en edificio premium con recepción, sala de reuniones y estacionamiento privado.',
    price: 6205000, barrio: 'Centro', tipo: 'oficina', estado: 'alquilado',
    disponibilidad_desde: '2025-01-15', disponibilidad_hasta: '2026-01-15',
    lat: -25.2822, lng: -57.6350, main_image: 'https://res.cloudinary.com/drupicep5/image/upload/v1774018258/f3b09a6c-6762-4643-b3b6-3185f09d3ed5.png', quote_count: 18,
    bathrooms: 2, area_m2: 120, operacion: 'alquiler',
  },
  {
    id: '5', store_id: 'osorio-eas', title: 'Casa familiar en Lambaré',
    description: 'Casa de 3 dormitorios con patio amplio y parrillero. Barrio tranquilo ideal para familias.',
    price: 1058500000, barrio: 'Lambaré', tipo: 'casa', estado: 'disponible',
    lat: -25.3460, lng: -57.6290, main_image: 'https://res.cloudinary.com/drupicep5/image/upload/v1774017336/9f111838-9deb-4fc2-aad1-9ec31c1ad83c.png', quote_count: 29,
    bedrooms: 3, bathrooms: 2, area_m2: 210, operacion: 'venta',
  },
  {
    id: '6', store_id: 'osorio-eas', title: 'Local comercial en Mariano',
    description: 'Local a la calle sobre avenida principal, ideal para comercio minorista o gastronómico.',
    price: 16060000, barrio: 'Mariano Roque Alonso', tipo: 'local', estado: 'disponible',
    lat: -25.2100, lng: -57.5300, main_image: 'https://res.cloudinary.com/drupicep5/image/upload/v1774017184/fe22ea26-c26a-40b4-8c86-be735da83311.png', quote_count: 12,
    area_m2: 180, operacion: 'alquiler',
  },
];

export const MOCK_NEIGHBORHOODS: Neighborhood[] = [
  { id: '1', store_id: 'osorio-eas', name: 'Villa Morra', price_m2: 13140000, min_factor: 0.85, max_factor: 1.2 },
  { id: '2', store_id: 'osorio-eas', name: 'Carmelitas', price_m2: 12045000, min_factor: 0.88, max_factor: 1.15 },
  { id: '3', store_id: 'osorio-eas', name: 'Centro', price_m2: 8760000, min_factor: 0.80, max_factor: 1.10 },
  { id: '4', store_id: 'osorio-eas', name: 'Luque', price_m2: 4745000, min_factor: 0.75, max_factor: 1.25 },
  { id: '5', store_id: 'osorio-eas', name: 'Lambaré', price_m2: 5840000, min_factor: 0.80, max_factor: 1.15 },
  { id: '6', store_id: 'osorio-eas', name: 'Mariano Roque Alonso', price_m2: 4015000, min_factor: 0.70, max_factor: 1.30 },
  { id: '7', store_id: 'osorio-eas', name: 'San Lorenzo', price_m2: 5110000, min_factor: 0.78, max_factor: 1.18 },
  { id: '8', store_id: 'osorio-eas', name: 'Fernando de la Mora', price_m2: 5475000, min_factor: 0.80, max_factor: 1.20 },
];

export const BARRIOS = MOCK_NEIGHBORHOODS.map(n => n.name);
export const TIPOS = ['casa', 'departamento', 'terreno', 'oficina', 'local'] as const;
export const OPERACIONES = ['venta', 'alquiler'] as const;
