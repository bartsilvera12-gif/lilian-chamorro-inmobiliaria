# Cambios recientes

> Este archivo se usa como bitácora “viva”.
> Cuando se configura el hook `post-commit`, se agrega automáticamente una entrada por cada commit que cambie código en `src/` (u otras rutas relevantes).

## [FECHA]

### Cambios realizados
- (resumen del cambio)

### Archivos modificados
- (ruta/archivo1.tsx)
- (ruta/archivo2.ts)

### Impacto
- (módulo afectado)

### Notas técnicas
- (decisiones tomadas)
- (problemas detectados)

## 2026-03-25

### Cambios realizados
- Implementa integración completa de Home/Admin con i18n y datos reales de Supabase.

### Archivos modificados
- docs/DOCUMENTACION_TECNICA_OSORIO_PROPERTY_HUB.md
- docs/DOCUMENTACION_TECNICA_OSORIO_PROPERTY_HUB.pdf
- docs/cambios-recientes.md
- docs/estado-proyecto.md
- package-lock.json
- package.json
- scripts/docs/record-change.mjs
- scripts/docs/setup-git-hooks.mjs
- scripts/supabase/apply-migrations.mjs
- src/App.tsx
- src/components/admin/AdminPropertyImagesManager.tsx
- src/components/admin/AdminSidebar.tsx
- src/components/home/CalculatorSection.tsx
- src/components/home/FeaturedProperties.tsx
- src/components/home/HeroSection.tsx
- src/components/home/MapPreview.tsx
- src/components/home/SuccessCasesSlider.tsx
- src/components/home/TestimonialsSection.tsx
- src/components/home/TransitionBanner.tsx
- src/components/property/PropertyCard.tsx
- src/components/property/QuoteModal.tsx
- src/components/ui/StyledSelect.tsx
- src/contexts/AuthContext.tsx
- src/i18n/translations.ts
- src/index.css
- src/lib/osorioRepository.ts
- src/lib/supabase.ts
- src/pages/Index.tsx
- src/pages/NotFound.tsx
- src/pages/Properties.tsx
- src/pages/PropertyDetail.tsx
- src/pages/admin/AdminDashboardPage.tsx
- src/pages/admin/AdminNeighborhoodsPage.tsx
- src/pages/admin/AdminPropertiesPage.tsx
- src/pages/admin/AdminPropertyFormPage.tsx
- src/pages/admin/AdminPropertyTypesPage.tsx
- src/pages/admin/AdminQuotesPage.tsx
- src/types/property.ts
- supabase/migrations/0001_init_osorio_inmuebles.sql
- supabase/migrations/0002_rls_policies_osorio_inmuebles.sql
- supabase/migrations/0003_clone_profiles_to_osorio_and_update_admin_fn.sql
- supabase/migrations/0004_add_alt_text_property_images.sql
- supabase/migrations/0005_quotes_decrement_quote_count_trigger.sql
- supabase/migrations/0006_storage_policies_property_images.sql

### Impacto
- Admin panel
- Sitio público
- Properties/Quotes UI
- Auth/Language
- i18n (traducciones)
- Supabase (cliente/config)

### Notas técnicas
- `QuoteModal` actualmente tiene un TODO para persistir en Supabase; validar impacto en creación de registros.
- Estas rutas/componentes del público usan `mockData` (MOCK_PROPERTIES / MOCK_NEIGHBORHOODS), no Supabase.
- El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.
- Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).
- Afecta la capa de internacionalización: revisar que todas las variantes (es/en/pt) estén completas.


### Cambios realizados
- Implementa integraci├│n completa de Home/Admin con i18n y datos reales de Supabase.  Se corrigen flujos de cotizaci├│n/estados, se agregan secciones y textos traducibles, y se restaura la presentaci├│n visual solicitada del banner y calculadora para dejar el sitio consistente con el comportamiento esperado.  Made-with: Cursor

### Archivos modificados
- docs/DOCUMENTACION_TECNICA_OSORIO_PROPERTY_HUB.md
- docs/DOCUMENTACION_TECNICA_OSORIO_PROPERTY_HUB.pdf
- docs/cambios-recientes.md
- docs/estado-proyecto.md
- package-lock.json
- package.json
- scripts/docs/record-change.mjs
- scripts/docs/setup-git-hooks.mjs
- scripts/supabase/apply-migrations.mjs
- src/App.tsx
- src/components/admin/AdminPropertyImagesManager.tsx
- src/components/admin/AdminSidebar.tsx
- src/components/home/CalculatorSection.tsx
- src/components/home/FeaturedProperties.tsx
- src/components/home/HeroSection.tsx
- src/components/home/MapPreview.tsx
- src/components/home/SuccessCasesSlider.tsx
- src/components/home/TestimonialsSection.tsx
- src/components/home/TransitionBanner.tsx
- src/components/property/PropertyCard.tsx
- src/components/property/QuoteModal.tsx
- src/components/ui/StyledSelect.tsx
- src/contexts/AuthContext.tsx
- src/i18n/translations.ts
- src/index.css
- src/lib/osorioRepository.ts
- src/lib/supabase.ts
- src/pages/Index.tsx
- src/pages/NotFound.tsx
- src/pages/Properties.tsx
- src/pages/PropertyDetail.tsx
- src/pages/admin/AdminDashboardPage.tsx
- src/pages/admin/AdminNeighborhoodsPage.tsx
- src/pages/admin/AdminPropertiesPage.tsx
- src/pages/admin/AdminPropertyFormPage.tsx
- src/pages/admin/AdminPropertyTypesPage.tsx
- src/pages/admin/AdminQuotesPage.tsx
- src/types/property.ts
- supabase/migrations/0001_init_osorio_inmuebles.sql
- supabase/migrations/0002_rls_policies_osorio_inmuebles.sql
- supabase/migrations/0003_clone_profiles_to_osorio_and_update_admin_fn.sql
- supabase/migrations/0004_add_alt_text_property_images.sql
- supabase/migrations/0005_quotes_decrement_quote_count_trigger.sql
- supabase/migrations/0006_storage_policies_property_images.sql

### Impacto
- Admin panel
- Sitio público
- Properties/Quotes UI
- Auth/Language
- i18n (traducciones)
- Supabase (cliente/config)

### Notas técnicas
- `QuoteModal` actualmente tiene un TODO para persistir en Supabase; validar impacto en creación de registros.
- Estas rutas/componentes del público usan `mockData` (MOCK_PROPERTIES / MOCK_NEIGHBORHOODS), no Supabase.
- El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.
- Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).
- Afecta la capa de internacionalización: revisar que todas las variantes (es/en/pt) estén completas.


### Cambios realizados
- Conecta Casos de Exito a Supabase con gestion desde Admin.

### Archivos modificados
- docs/cambios-recientes.md
- src/App.tsx
- src/components/admin/AdminSidebar.tsx
- src/components/home/SuccessCasesSlider.tsx
- src/i18n/translations.ts
- src/lib/osorioRepository.ts
- src/pages/admin/AdminSuccessCasesPage.tsx
- supabase/migrations/0007_create_success_cases.sql

### Impacto
- Admin panel
- Sitio público
- i18n (traducciones)
- Supabase (cliente/config)

### Notas técnicas
- Estas rutas/componentes del público usan `mockData` (MOCK_PROPERTIES / MOCK_NEIGHBORHOODS), no Supabase.
- El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.
- Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).
- Afecta la capa de internacionalización: revisar que todas las variantes (es/en/pt) estén completas.


### Cambios realizados
- Usar schema PostgreSQL osorio_inmuebles en lugar del identificador legacy con mayúsculas

### Archivos modificados
- .env.example
- docs/DOCUMENTACION_TECNICA_OSORIO_PROPERTY_HUB.md
- docs/cambios-recientes.md
- docs/estado-proyecto.md
- scripts/docs/record-change.mjs
- src/lib/supabase.ts
- src/types/property.ts
- supabase/migrations/0001_init_osorio_inmuebles.sql
- supabase/migrations/0002_rls_policies_osorio_inmuebles.sql
- supabase/migrations/0003_clone_profiles_to_osorio_and_update_admin_fn.sql
- supabase/migrations/0004_add_alt_text_property_images.sql
- supabase/migrations/0005_quotes_decrement_quote_count_trigger.sql
- supabase/migrations/0006_storage_policies_property_images.sql
- supabase/migrations/0007_create_success_cases.sql
- supabase/migrations/0008_rename_legacy_schema_to_osorio_inmuebles.sql

### Impacto
- Supabase (cliente/config)

### Notas técnicas
- El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.
- Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).


### Cambios realizados
- Fix: render fallback mocks on Supabase exceptions

### Archivos modificados
- src/lib/osorioRepository.ts

### Impacto
- Supabase (cliente/config)

### Notas técnicas
- El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.
- Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).

## 2026-03-26

### Cambios realizados
- Add testimonials and development modules with admin management.

### Archivos modificados
- .env.example
- docs/cambios-recientes.md
- index.html
- package.json
- public/favicon.png
- scripts/create-osorio-admin.mjs
- src/App.tsx
- src/components/admin/AdminSidebar.tsx
- src/components/home/CalculatorSection.tsx
- src/components/home/MapPreview.tsx
- src/components/home/TestimonialsSection.tsx
- src/components/layout/Footer.tsx
- src/components/layout/Navbar.tsx
- src/components/property/PropertyCard.tsx
- src/i18n/translations.ts
- src/lib/currency.ts
- src/lib/hashScroll.ts
- src/lib/osorioRepository.ts
- src/pages/Developments.tsx
- src/pages/Index.tsx
- src/pages/PropertyDetail.tsx
- src/pages/Testimonials.tsx
- src/pages/admin/AdminDashboard.tsx
- src/pages/admin/AdminDevelopmentsPage.tsx
- src/pages/admin/AdminPropertiesPage.tsx
- src/pages/admin/AdminPropertyFormPage.tsx
- src/pages/admin/AdminTestimonialsPage.tsx
- supabase/functions/send-work-application/config.json
- supabase/functions/send-work-application/index.ts
- supabase/migrations/0009_create_testimonials_and_developments.sql

### Impacto
- Admin panel
- Sitio público
- Properties/Quotes UI
- i18n (traducciones)
- Supabase (cliente/config)

### Notas técnicas
- Estas rutas/componentes del público usan `mockData` (MOCK_PROPERTIES / MOCK_NEIGHBORHOODS), no Supabase.
- El panel admin consulta/escribe Supabase y aplica multi-tenant con `store_id` desde `profiles.store_id`.
- Si el requisito es usar siempre schema `osorio_inmuebles`, revisar si el cliente debe apuntar a ese schema (por ejemplo usando `.schema('osorio_inmuebles')`).
- Afecta la capa de internacionalización: revisar que todas las variantes (es/en/pt) estén completas.

