// Utilidades de formato y fechas.
// Las fechas se guardan como ISO 'yyyy-mm-dd' (sin hora) para los períodos,
// y se manipulan por partes para evitar saltos de día por zona horaria.

export const MONEDA = 'CUP'

export function formatMoneda(n: number): string {
  const formato = n.toLocaleString('es-CU', { maximumFractionDigits: 2 })
  return `${formato} ${MONEDA}`
}

/** Fecha de hoy en formato ISO 'yyyy-mm-dd' (zona horaria local). */
export function hoyISO(): string {
  const d = new Date()
  return toISO(d.getFullYear(), d.getMonth(), d.getDate())
}

function toISO(year: number, monthIndex: number, day: number): string {
  const mm = String(monthIndex + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** Suma `meses` a una fecha ISO y devuelve la nueva fecha ISO. */
export function sumarMeses(iso: string, meses: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  base.setMonth(base.getMonth() + meses)
  return toISO(base.getFullYear(), base.getMonth(), base.getDate())
}

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

/** '2026-05-31' -> '31 may 2026' */
export function formatFecha(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${y}`
}

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Mes ('yyyy-mm') de una fecha ISO. */
export const mesDe = (iso: string): string => iso.slice(0, 7)

/** Mes actual en formato 'yyyy-mm'. */
export const mesActual = (): string => hoyISO().slice(0, 7)

/** Mes anterior a un 'yyyy-mm'. */
export function mesAnterior(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** '2026-06' -> 'junio 2026' */
export function nombreMes(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  return `${MESES_LARGO[m - 1]} ${y}`
}

/** Diferencia en días entre dos fechas ISO (b - a). */
export function diasEntre(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = Date.UTC(ay, am - 1, ad)
  const db = Date.UTC(by, bm - 1, bd)
  return Math.round((db - da) / 86_400_000)
}
