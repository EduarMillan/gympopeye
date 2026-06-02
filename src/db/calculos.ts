import type { Pago, Promocion } from './db'
import { diasEntre, hoyISO, sumarMeses } from '../lib/format'

// --- Promociones ---------------------------------------------------------

export type ResultadoPromo = {
  montoFinal: number
  mesesBonus: number // meses extra de período (para "meses_gratis")
  descripcion: string
}

/** Aplica una promoción a un monto base. */
export function aplicarPromocion(
  montoBase: number,
  promo?: Promocion,
): ResultadoPromo {
  if (!promo) {
    return { montoFinal: montoBase, mesesBonus: 0, descripcion: '' }
  }
  switch (promo.tipo) {
    case 'descuento_porcentaje': {
      const montoFinal = Math.max(0, montoBase * (1 - promo.valor / 100))
      return { montoFinal, mesesBonus: 0, descripcion: `-${promo.valor}%` }
    }
    case 'descuento_fijo': {
      const montoFinal = Math.max(0, montoBase - promo.valor)
      return { montoFinal, mesesBonus: 0, descripcion: `-${promo.valor}` }
    }
    case 'meses_gratis': {
      return {
        montoFinal: montoBase,
        mesesBonus: promo.valor,
        descripcion: `+${promo.valor} mes(es)`,
      }
    }
  }
}

/** ¿La promoción está vigente hoy? */
export function promoVigente(promo: Promocion): boolean {
  if (!promo.activo) return false
  const hoy = hoyISO()
  if (promo.vigenciaDesde && hoy < promo.vigenciaDesde) return false
  if (promo.vigenciaHasta && hoy > promo.vigenciaHasta) return false
  return true
}

// --- Estado de socio (según último pago) ---------------------------------

export type EstadoSocio = 'al_dia' | 'por_vencer' | 'vencido' | 'sin_pagos'

export type InfoEstado = {
  estado: EstadoSocio
  vencimiento?: string // periodoHasta del último pago
  diasRestantes?: number // negativo si ya venció
}

/** Calcula el estado de un socio a partir de sus pagos. */
export function estadoDeSocio(pagos: Pago[]): InfoEstado {
  if (pagos.length === 0) return { estado: 'sin_pagos' }

  // El pago con periodoHasta más lejano define hasta cuándo está cubierto.
  const vencimiento = pagos.reduce(
    (max, p) => (p.periodoHasta > max ? p.periodoHasta : max),
    pagos[0].periodoHasta,
  )
  const diasRestantes = diasEntre(hoyISO(), vencimiento)

  let estado: EstadoSocio
  if (diasRestantes < 0) estado = 'vencido'
  else if (diasRestantes <= 5) estado = 'por_vencer'
  else estado = 'al_dia'

  return { estado, vencimiento, diasRestantes }
}

/**
 * Estima cuánto debe un socio vencido: última mensualidad pagada × meses
 * vencidos. Para "sin pagos" no hay base de cálculo y devuelve null.
 */
export function deudaEstimada(
  pagos: Pago[],
): { monto: number; meses: number } | null {
  const info = estadoDeSocio(pagos)
  if (info.estado !== 'vencido' || info.diasRestantes === undefined) return null

  // Último pago según el período cubierto más lejano (define la mensualidad).
  const ultimo = pagos.reduce((a, b) => (b.periodoHasta > a.periodoHasta ? b : a))
  const meses = Math.max(1, Math.ceil(-info.diasRestantes / 30))
  return { monto: ultimo.monto * meses, meses }
}

/** Período de un mes a partir de una fecha de inicio (+ meses bonus). */
export function calcularPeriodo(desde: string, mesesBonus: number) {
  return { periodoDesde: desde, periodoHasta: sumarMeses(desde, 1 + mesesBonus) }
}
