BEGIN;

DO $$
DECLARE
  barrio_limpio uuid;
  barrio_san_vicente uuid;
  barrio_lambare uuid;
  barrio_villa_morra uuid;
  tipo_terreno uuid;
  tipo_salon uuid;
  tipo_casa uuid;
  tipo_departamento uuid;
  p_lambare uuid;
  p_villa_morra uuid;
BEGIN
  IF to_regclass('lilian_inmobiliaria.properties') IS NULL THEN
    RAISE EXCEPTION 'Tabla lilian_inmobiliaria.properties no existe';
  END IF;

  SELECT id INTO barrio_limpio FROM lilian_inmobiliaria.barrios WHERE lower(nombre) LIKE '%limpio%' ORDER BY nombre LIMIT 1;
  SELECT id INTO barrio_san_vicente FROM lilian_inmobiliaria.barrios WHERE lower(nombre) LIKE '%san vicente%' ORDER BY nombre LIMIT 1;
  SELECT id INTO barrio_lambare FROM lilian_inmobiliaria.barrios WHERE lower(nombre) LIKE '%lambar%' ORDER BY nombre LIMIT 1;
  SELECT id INTO barrio_villa_morra FROM lilian_inmobiliaria.barrios WHERE lower(nombre) LIKE '%villa morra%' ORDER BY nombre LIMIT 1;

  SELECT id INTO tipo_terreno FROM lilian_inmobiliaria.property_types WHERE lower(nombre) LIKE '%terreno%' ORDER BY nombre LIMIT 1;
  SELECT id INTO tipo_salon FROM lilian_inmobiliaria.property_types WHERE lower(nombre) LIKE '%salon%' OR lower(nombre) LIKE '%comercial%' ORDER BY nombre LIMIT 1;
  SELECT id INTO tipo_casa FROM lilian_inmobiliaria.property_types WHERE lower(nombre) LIKE '%casa%' ORDER BY nombre LIMIT 1;
  SELECT id INTO tipo_departamento FROM lilian_inmobiliaria.property_types WHERE lower(nombre) LIKE '%departamento%' ORDER BY nombre LIMIT 1;

  IF barrio_limpio IS NULL THEN SELECT id INTO barrio_limpio FROM lilian_inmobiliaria.barrios ORDER BY nombre LIMIT 1; END IF;
  IF barrio_san_vicente IS NULL THEN SELECT id INTO barrio_san_vicente FROM lilian_inmobiliaria.barrios ORDER BY nombre LIMIT 1; END IF;
  IF barrio_lambare IS NULL THEN SELECT id INTO barrio_lambare FROM lilian_inmobiliaria.barrios ORDER BY nombre LIMIT 1; END IF;
  IF barrio_villa_morra IS NULL THEN SELECT id INTO barrio_villa_morra FROM lilian_inmobiliaria.barrios ORDER BY nombre LIMIT 1; END IF;

  IF tipo_terreno IS NULL THEN SELECT id INTO tipo_terreno FROM lilian_inmobiliaria.property_types ORDER BY nombre LIMIT 1; END IF;
  IF tipo_salon IS NULL THEN SELECT id INTO tipo_salon FROM lilian_inmobiliaria.property_types ORDER BY nombre LIMIT 1; END IF;
  IF tipo_casa IS NULL THEN SELECT id INTO tipo_casa FROM lilian_inmobiliaria.property_types ORDER BY nombre LIMIT 1; END IF;
  IF tipo_departamento IS NULL THEN SELECT id INTO tipo_departamento FROM lilian_inmobiliaria.property_types ORDER BY nombre LIMIT 1; END IF;

  -- Editar propiedad 2: Terreno
  UPDATE lilian_inmobiliaria.properties
  SET
    title = 'Vendo Terreno en Limpio - Lote Urbanizado',
    description = 'Medidas: 12x40 metros. Excelente para vivienda o inversión, zona urbanizada con rápido acceso.',
    price = 65000000,
    price_currency = 'PYG',
    operation_type = 'venta',
    status = 'vendido',
    bedrooms = 0,
    bathrooms = 0,
    area_m2 = 480,
    barrio_id = barrio_limpio,
    property_type_id = tipo_terreno
  WHERE lower(title) = lower('Vendo Terreno en Limpio - Lote Urbanizado');

  -- Editar propiedad 3: Salón comercial
  UPDATE lilian_inmobiliaria.properties
  SET
    title = 'SALON COMERCIAL SOBRE AVENIDA',
    description = 'Salón comercial con excelente visibilidad, ideal para oficinas o local de atención al público.',
    price = 3000000,
    price_currency = 'PYG',
    operation_type = 'alquiler',
    status = 'alquilado',
    bedrooms = 0,
    bathrooms = 2,
    area_m2 = 150,
    barrio_id = barrio_san_vicente,
    property_type_id = tipo_salon
  WHERE lower(title) = lower('SALON COMERCIAL SOBRE AVENIDA');

  -- Insertar propiedad nueva 1
  INSERT INTO lilian_inmobiliaria.properties (
    id, title, description, price, price_currency, operation_type, status,
    bedrooms, bathrooms, area_m2, barrio_id, property_type_id, quote_count
  )
  VALUES (
    gen_random_uuid(),
    'Casa Familiar en Lambaré',
    'Casa funcional con patio y cochera, en zona residencial tranquila.',
    420000000,
    'PYG',
    'venta',
    'disponible',
    3, 2, 210,
    barrio_lambare,
    tipo_casa,
    0
  )
  RETURNING id INTO p_lambare;

  INSERT INTO lilian_inmobiliaria.property_images (
    id, property_id, image_url, is_primary, sort_order
  )
  VALUES (
    gen_random_uuid(),
    p_lambare,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    true,
    0
  );

  -- Insertar propiedad nueva 2
  INSERT INTO lilian_inmobiliaria.properties (
    id, title, description, price, price_currency, operation_type, status,
    bedrooms, bathrooms, area_m2, barrio_id, property_type_id, quote_count
  )
  VALUES (
    gen_random_uuid(),
    'Departamento Premium en Villa Morra',
    'Departamento moderno con balcón, amenities y excelente ubicación.',
    1250,
    'USD',
    'alquiler',
    'disponible',
    2, 2, 120,
    barrio_villa_morra,
    tipo_departamento,
    0
  )
  RETURNING id INTO p_villa_morra;

  INSERT INTO lilian_inmobiliaria.property_images (
    id, property_id, image_url, is_primary, sort_order
  )
  VALUES (
    gen_random_uuid(),
    p_villa_morra,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
    true,
    0
  );
END $$;

COMMIT;
