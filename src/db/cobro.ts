import { diasEntre, sumarMeses } from '../lib/format'

function ultimoDiaMes(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Día de cobro de un mes concreto, recortado al último día si hace falta. */
function diaCobroISO(year: number, monthIndex: number, dia: number): string {
  const d = Math.min(dia, ultimoDiaMes(year, monthIndex))
  const mm = String(monthIndex + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** Próximo día de cobro estrictamente posterior a `iso`. */
export function proximoDiaCobro(iso: string, dia: number): string {
  const [y, m] = iso.split('-').map(Number)
  const candidato = diaCobroISO(y, m - 1, dia)
  if (candidato > iso) return candidato
  const sig = new Date(y, m, 1) // mes siguiente
  return diaCobroISO(sig.getFullYear(), sig.getMonth(), dia)
}

export type Cobro = {
  periodoDesde: string
  periodoHasta: string
  monto: number // base, antes de promoción
  esProrrateo: boolean
  dias: number
  cicloDias: number
}

/**
 * Calcula el período y monto de un pago según el día de cobro del gym:
 *  - Sin cobertura previa (socio nuevo): prorratea desde `desde` hasta el
 *    próximo día de cobro. monto = precio × días / días del ciclo.
 *  - Con cobertura (renovación): un ciclo completo desde la cobertura actual,
 *    al precio completo.
 */
export function calcularCobro(params: {
  coberturaHasta: string | null
  diaCobro: number
  precio: number
  desde: string
}): Cobro {
  const { coberturaHasta, diaCobro, precio, desde } = params

  if (coberturaHasta) {
    const periodoHasta = sumarMeses(coberturaHasta, 1)
    const dias = diasEntre(coberturaHasta, periodoHasta)
    return {
      periodoDesde: coberturaHasta,
      periodoHasta,
      monto: precio,
      esProrrateo: false,
      dias,
      cicloDias: dias,
    }
  }

  const periodoHasta = proximoDiaCobro(desde, diaCobro)
  const inicioCiclo = sumarMeses(periodoHasta, -1)
  const cicloDias = diasEntre(inicioCiclo, periodoHasta)
  const dias = diasEntre(desde, periodoHasta)
  const esProrrateo = dias < cicloDias
  const monto = esProrrateo
    ? Math.round((precio * dias) / cicloDias)
    : precio
  return { periodoDesde: desde, periodoHasta, monto, esProrrateo, dias, cicloDias }
}
