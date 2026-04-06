-- Asocia barrios a ciudades (distritos en `ciudades`).
-- 1) Catálogo inicial 0001 (Osorio): barrios de la capital → Asunción.
-- 2) Otros barrios: nombre exacto = distrito, salvo homónimos (San Antonio, Bella Vista, Santa Rosa, San Pablo).
-- 3) Sin ciudad → Asunción.
-- Idempotente.

BEGIN;

DO $$
DECLARE
  v_asuncion uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'lilian_inmobiliaria') THEN
    RAISE NOTICE 'Schema lilian_inmobiliaria no existe; omitido.';
    RETURN;
  END IF;
  IF to_regclass('lilian_inmobiliaria.barrios') IS NULL OR to_regclass('lilian_inmobiliaria.ciudades') IS NULL THEN
    RAISE NOTICE 'Tablas barrios/ciudades no existen; omitido.';
    RETURN;
  END IF;

  SELECT id INTO v_asuncion FROM lilian_inmobiliaria.ciudades WHERE nombre = 'Asunción' LIMIT 1;
  IF v_asuncion IS NULL THEN
    RAISE NOTICE 'No hay ciudad Asunción en ciudades; omitido.';
    RETURN;
  END IF;

  CREATE TEMP TABLE _tmp_osorio_capital_barrios (nombre text PRIMARY KEY) ON COMMIT DROP;

  INSERT INTO _tmp_osorio_capital_barrios (nombre) VALUES
    ('La Encarnación'),
    ('Itá Pytã Punta'),
    ('Sajonia'),
    ('San Antonio'),
    ('Dr. Francia'),
    ('Tacumbú'),
    ('Barrio Obrero'),
    ('La Catedral / San Roque (Sector Catedral)'),
    ('General Díaz'),
    ('San Blas'),
    ('San Jorge'),
    ('Ytay'),
    ('Santa María'),
    ('Marangatú'),
    ('Manorá'),
    ('Las Lomas (Carmelitas)'),
    ('Mariscal López'),
    ('Las Mercedes'),
    ('Mburicaó'),
    ('Jara'),
    ('Virgen del Huerto'),
    ('San Roque'),
    ('Ciudad Nueva'),
    ('Pinozá'),
    ('Villa Morra'),
    ('Recoleta'),
    ('San Cristóbal'),
    ('Los Laureles'),
    ('Mcal. Estigarribia'),
    ('San Vicente'),
    ('Tembetary'),
    ('San Pablo'),
    ('Hipódromo'),
    ('Terminal'),
    ('Nazareth'),
    ('Mburucuyá'),
    ('Santísima Trinidad / Salvador del Mundo'),
    ('Mbocayaty'),
    ('Santa Rosa'),
    ('Bella Vista'),
    ('Zeballos Cué'),
    ('Loma Pytá'),
    ('Ricardo Brugada (Chacarita)'),
    ('Ricardo Brugada (San Roque)'),
    ('Iturbe'),
    ('Tablada Nueva'),
    ('Santo Domingo'),
    ('Cañada del Ybyray'),
    ('Virgen de la Asunción'),
    ('Botánico'),
    ('Virgen de Fátima'),
    ('San Rafael'),
    ('Bernardino Caballero'),
    ('Vista Alegre'),
    ('Madame Lynch'),
    ('Pettirossi'),
    ('Santa Librada / Itá Enramada'),
    ('Republicano');

  UPDATE lilian_inmobiliaria.barrios b
  SET ciudad_id = v_asuncion
  FROM _tmp_osorio_capital_barrios s
  WHERE b.nombre = s.nombre;

  UPDATE lilian_inmobiliaria.barrios b
  SET ciudad_id = c.id
  FROM lilian_inmobiliaria.ciudades c
  WHERE lower(trim(b.nombre)) = lower(trim(c.nombre))
    AND NOT EXISTS (SELECT 1 FROM _tmp_osorio_capital_barrios s WHERE s.nombre = b.nombre)
    AND c.nombre NOT IN ('San Antonio', 'Bella Vista', 'Santa Rosa', 'San Pablo');

  UPDATE lilian_inmobiliaria.barrios b
  SET ciudad_id = v_asuncion
  WHERE b.ciudad_id IS NULL;
END $$;

COMMIT;
