import type { CategoriaGasto, Gasto, Pago, Socio } from './db'
import { estadoDeSocio } from './calculos'
import { mesActual, mesAnterior, mesDe } from '../lib/format'

export type Estadisticas = {
  mes: string // 'yyyy-mm' actual
  ingresosMes: number
  gastosMes: number
  balanceMes: number
  variacionIngresos: number | null // % vs mes anterior (null si no hay base)
  totalIngresos: number
  totalGastos: number
  acumuladoNeto: number // ingresos - gastos histórico
  mesesTranscurridos: number
  promedioIngresos: number
  promedioGastos: number
  promedioGanancia: number
  gastosPorCategoria: { categoria: CategoriaGasto; total: number }[]
  sociosActivos: number
  deudores: number
}

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Cuenta de meses desde el primero con actividad hasta el mes actual (incl.). */
function mesesDesde(primero: string, actual: string): number {
  const [y1, m1] = primero.split('-').map(Number)
  const [y2, m2] = actual.split('-').map(Number)
  return (y2 * 12 + m2) - (y1 * 12 + m1) + 1
}

export function calcularEstadisticas(
  pagos: Pago[],
  gastos: Gasto[],
  socios: Socio[],
): Estadisticas {
  const mes = mesActual()
  const anterior = mesAnterior(mes)

  const ingresosMes = suma(
    pagos.filter((p) => mesDe(p.fecha) === mes).map((p) => p.monto),
  )
  const gastosMes = suma(
    gastos.filter((g) => mesDe(g.fecha) === mes).map((g) => g.monto),
  )
  const ingresosMesAnterior = suma(
    pagos.filter((p) => mesDe(p.fecha) === anterior).map((p) => p.monto),
  )

  const totalIngresos = suma(pagos.map((p) => p.monto))
  const totalGastos = suma(gastos.map((g) => g.monto))

  // Meses transcurridos (para promedios) según el registro más antiguo.
  const fechas = [...pagos.map((p) => p.fecha), ...gastos.map((g) => g.fecha)]
  const primerMes = fechas.length ? mesDe(fechas.reduce((a, b) => (a < b ? a : b))) : mes
  const mesesTranscurridos = Math.max(1, mesesDesde(primerMes, mes))

  // Gastos del mes por categoría (mayor a menor).
  const porCat = new Map<CategoriaGasto, number>()
  for (const g of gastos) {
    if (mesDe(g.fecha) !== mes) continue
    porCat.set(g.categoria, (porCat.get(g.categoria) ?? 0) + g.monto)
  }
  const gastosPorCategoria = [...porCat.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)

  // Estado de socios para contar deudores.
  const pagosPorSocio = new Map<string, Pago[]>()
  for (const p of pagos) {
    const arr = pagosPorSocio.get(p.socioId) ?? []
    arr.push(p)
    pagosPorSocio.set(p.socioId, arr)
  }
  const activos = socios.filter((s) => s.activo)
  const deudores = activos.filter((s) => {
    const e = estadoDeSocio(pagosPorSocio.get(s.id) ?? []).estado
    return e === 'vencido' || e === 'sin_pagos'
  }).length

  return {
    mes,
    ingresosMes,
    gastosMes,
    balanceMes: ingresosMes - gastosMes,
    variacionIngresos:
      ingresosMesAnterior > 0
        ? ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100
        : null,
    totalIngresos,
    totalGastos,
    acumuladoNeto: totalIngresos - totalGastos,
    mesesTranscurridos,
    promedioIngresos: totalIngresos / mesesTranscurridos,
    promedioGastos: totalGastos / mesesTranscurridos,
    promedioGanancia: (totalIngresos - totalGastos) / mesesTranscurridos,
    gastosPorCategoria,
    sociosActivos: activos.length,
    deudores,
  }
}
