/**
 * Cotización Gs/USD (VITE_PYG_PER_USD).
 * Cada propiedad guarda `price` + `price_currency` (USD | PYG); la UI formatea según la moneda.
 */
export const PYG_PER_USD = (() => {
  const v = Number(import.meta.env.VITE_PYG_PER_USD);
  return Number.isFinite(v) && v > 0 ? v : 7500;
})();

export function pygToUsd(pyg: number): number {
  if (!Number.isFinite(pyg) || pyg <= 0) return 0;
  return pyg / PYG_PER_USD;
}

export function usdToPyg(usd: number): number {
  if (!Number.isFinite(usd) || usd < 0) return 0;
  return Math.round(usd * PYG_PER_USD);
}

/** Valor en USD ya calculado (p. ej. calculadora) */
export function formatUsd(amount: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(amount);
}

/** Valor en Gs/m² → USD/m² (misma cotización) */
export function formatPricePerM2FromPyg(pygPerM2: number): string {
  return `${formatUsd(pygToUsd(pygPerM2))}/m²`;
}

/** Campo admin: Gs de BD → string USD para el input cuando la moneda es USD */
export function pygToUsdFormString(pyg: number): string {
  const usd = pygToUsd(pyg);
  if (!Number.isFinite(usd) || usd <= 0) return '';
  return Number(usd.toFixed(2)).toString();
}

export function parseUsdInput(raw: string): number {
  const n = parseFloat(raw.replace(',', '.').trim());
  return Number.isFinite(n) ? n : NaN;
}

export type PriceCurrency = 'USD' | 'PYG';

export function isPriceCurrency(v: unknown): v is PriceCurrency {
  return v === 'USD' || v === 'PYG';
}

/** Guaraníes: "Gs. X.XXX.XXX" */
export function formatPyg(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return 'Gs. 0';
  const n = Math.round(amount);
  const num = new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return `Gs. ${num}`;
}

/** Input admin: acepta "1500000" o "1.500.000" (puntos como miles). */
export function parsePygInput(raw: string): number {
  const cleaned = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN;
}

/** Precio según moneda guardada en BD (venta o alquiler + /mes). */
export function formatPropertyPrice(amount: number, currency: PriceCurrency, isRent: boolean): string {
  const base =
    currency === 'USD'
      ? formatUsd(amount, amount % 1 !== 0 ? 2 : 0)
      : formatPyg(amount);
  return isRent ? `${base}/mes` : base;
}

/** Atajo: precio almacenado solo en guaraníes (p. ej. mocks sin currency). */
export function formatPropertyPriceFromPyg(pyg: number, isRent: boolean): string {
  return formatPropertyPrice(pyg, 'PYG', isRent);
}

/** Ordenar / comparar precios mezclando USD y PYG (normaliza a Gs). */
export function priceToComparablePyg(amount: number, currency: PriceCurrency): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return currency === 'USD' ? usdToPyg(amount) : Math.round(amount);
}
