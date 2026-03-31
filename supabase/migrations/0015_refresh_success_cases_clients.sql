-- Casos de éxito: textos actualizados e imagen de cliente conforme (retrato) por caso.
BEGIN;

DO $$
BEGIN
  IF to_regclass('lilian_inmobiliaria.success_cases') IS NULL THEN
    RAISE NOTICE 'lilian_inmobiliaria.success_cases no existe; omitido.';
    RETURN;
  END IF;

  DELETE FROM lilian_inmobiliaria.success_cases;

  INSERT INTO lilian_inmobiliaria.success_cases (image_url, description_es, sort_order, is_active)
  VALUES
    (
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
      'María vendió su casa en Villa Morra en pocos meses; hoy está conforme y recomienda el equipo de Lilian Chamorro Inmobiliaria.',
      1,
      TRUE
    ),
    (
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80',
      'Roberto alquiló su departamento con un inquilino verificado y quedó muy conforme con la gestión transparente de principio a fin.',
      2,
      TRUE
    ),
    (
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1200&q=80',
      'La familia Gómez compró su casa en Lambaré con asesoramiento cercano y negociación clara; celebraron el cierre con total confianza.',
      3,
      TRUE
    ),
    (
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80',
      'Laura revalorizó su propiedad con una estrategia de venta profesional y recibió una oferta que superó sus expectativas.',
      4,
      TRUE
    );
END $$;

COMMIT;
