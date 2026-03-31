/** Scroll a sección por id (sin #). `block: 'center'` para alinear la sección al centro del viewport. */
export function scrollToHashElement(hashOrId: string, behavior: ScrollBehavior = 'smooth') {
  const id = hashOrId.startsWith('#') ? hashOrId.slice(1) : hashOrId;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior, block: 'center' });
}
