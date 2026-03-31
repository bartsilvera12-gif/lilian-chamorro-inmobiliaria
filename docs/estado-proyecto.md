# Estado del Proyecto

## Resumen general
- Proyecto: **Osorio Property Hub**
- Stack: **Vite + React + TypeScript + Supabase**
- Estado actual (a esta fecha):
  - Sitio público: funciona con **datos mock** (no consulta Supabase).
  - Panel admin: consulta y escribe en **Supabase** (Auth, tablas y Storage).
  - Cotización (público): el modal tiene **TODO** y actualmente **no persiste** cotizaciones en Supabase.
  - Multi-tenant: admin filtra por `store_id` según `profiles.store_id`.
  - Schema Supabase: el cliente `osorio` en `src/lib/supabase.ts` usa `supabase.schema('osorio_inmuebles')` para las tablas de negocio.

## Arquitectura actual
- Frontend:
  - Ruteo con `react-router-dom` en `src/App.tsx`.
  - UI con Tailwind y componentes estilo shadcn/ui (Radix).
  - i18n con `LanguageContext` y `src/i18n/translations.ts`.
  - Mapas con `react-leaflet` y Leaflet.
- Backend:
  - No hay un servidor propio; el backend es **Supabase** (Postgres + Auth + Storage).
- Autenticación:
  - Existe para admin con Supabase Auth email/password.
  - Control UI con `AdminProtectedRoute` validando `profile.role === 'admin'`.
- Multi-tenant:
  - Admin filtra por `store_id` en casi todas las consultas:
    - `eq('store_id', profile.store_id)`
  - El público no usa `store_id` porque trabaja con mock.

## Módulos principales

### Properties (sitio público)
- Estado: **mock**
- Conexión a Supabase: **no**
- Problemas detectados:
  - El listado `/propiedades` filtra sobre `MOCK_PROPERTIES` (no sobre DB).
  - El cálculo de resultados depende del mock; no refleja datos reales del backend.

### Property Detail (sitio público)
- Estado: **mock**
- Conexión a Supabase: **no**
- Problemas detectados:
  - La página `PropertyDetail` busca en `MOCK_PROPERTIES` y renderiza imágenes/galería con recursos fijos.

### Quotes (público)
- Estado: **incompleto**
- Conexión a Supabase: **parcial/no**
- Problemas detectados:
  - `QuoteModal` contiene `// TODO: Save to Supabase quotes table`.
  - Al enviar, solo simula y cierra el modal; no crea registros en `quotes`.

### Auth (admin)
- Estado: **real**
- Conexión a Supabase: **sí**
- Problemas detectados:
  - La app carga perfil desde `profiles` por `id` del usuario de Supabase.
  - Perfil de sesión sigue leyendo `profiles` según la implementación actual de `AuthContext`.

### Admin panel
- Estado: **real** (CRUD + Storage)
- Conexión a Supabase: **sí**
- Problemas detectados:
  - La lectura/escritura de tablas de negocio usa `osorio.from('tabla')` (schema `osorio_inmuebles`).
  - El panel usa `store_id` (multi-tenant) para aislar datos.

### Public site (Home / Mapa / Calculadora)
- Estado: **mock**
- Conexión a Supabase: **no**
- Problemas detectados:
  - `HeroSection` navega a `/propiedades` pero el listado usa mock.
  - `MapPreview` usa `MOCK_PROPERTIES`.
  - `CalculatorSection` calcula con factores desde `MOCK_NEIGHBORHOODS`.
  - La UI permite seleccionar tipo/operación, pero el cálculo depende principalmente del barrio (mock) y del área.
  - Internacionalización incompleta en algunas secciones del home (hay textos hardcodeados en español en componentes como `MapPreview`/`TransitionBanner`).

## Base de datos

### Tablas utilizadas (por el frontend)
Las consultas observadas usan estas tablas:
- `profiles`
- `products_inmobiliaria`
- `neighborhoods`
- `quotes`
- `product_images_inmobiliaria`

### Storage utilizado
- Bucket: `property-images`
- Lógica: se suben imágenes y se guarda la URL en `product_images_inmobiliaria.image_url`.

### Schema
- Estado detectado en el código:
  - Las operaciones de negocio usan el cliente `osorio` (`supabase.schema('osorio_inmuebles')`).
- Requisito:
  - Schema PostgreSQL único: `osorio_inmuebles` (configurable con `VITE_BUSINESS_SCHEMA` / `NEXT_PUBLIC_BUSINESS_SCHEMA`).

## Pendientes críticos
- [ ] Persistir cotizaciones desde `QuoteModal` (crear filas en `quotes`).
- [x] Usar esquema `osorio_inmuebles` en consultas de negocio vía cliente `osorio` (revisar Storage/policies según despliegue).
- [ ] Revisar inconsistencia de calculadora: validar si `tipo` y `operacion` deben afectar el cálculo o ajustar UI.
- [ ] Completar i18n: mover textos hardcodeados del home a `src/i18n/translations.ts` para que ES/EN/PT sean consistentes.
- [ ] (Opcional) Corregir `npm run lint` si se requiere pipeline CI: hay errores ESLint preexistentes.

