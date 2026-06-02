import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { db } from '../db/db'
import { calcularEstadisticas } from '../db/estadisticas'
import { etiquetaCategoria } from '../db/gastos'
import { formatMoneda, nombreMes } from '../lib/format'

function Tile({
  label,
  children,
  accent = 'text-on-surface',
  className = '',
  onClick,
}: {
  label: string
  children: ReactNode
  accent?: string
  className?: string
  onClick?: () => void
}) {
  const base = 'flex flex-col justify-between gap-1 card-metal p-4'
  const inner = (
    <>
      <span className="flex items-center justify-between text-label-sm uppercase tracking-wide text-on-surface-variant">
        {label}
        {onClick && <ChevronRight size={16} />}
      </span>
      <span className={`font-headline text-headline-md ${accent}`}>
        {children}
      </span>
    </>
  )
  return onClick ? (
    <button
      onClick={onClick}
      className={`${base} text-left transition active:scale-[0.98] ${className}`}
    >
      {inner}
    </button>
  ) : (
    <div className={`${base} ${className}`}>{inner}</div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const pagos = useLiveQuery(
    () => db.pagos.filter((p) => !p.eliminado).toArray(),
    [],
  )
  const gastos = useLiveQuery(
    () => db.gastos.filter((g) => !g.eliminado).toArray(),
    [],
  )
  const socios = useLiveQuery(
    () => db.socios.filter((s) => !s.eliminado).toArray(),
    [],
  )

  const stats = useMemo(() => {
    if (!pagos || !gastos || !socios) return null
    return calcularEstadisticas(pagos, gastos, socios)
  }, [pagos, gastos, socios])

  if (!stats) return null

  const balancePositivo = stats.balanceMes >= 0
  const maxCategoria = Math.max(
    1,
    ...stats.gastosPorCategoria.map((c) => c.total),
  )

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="font-headline text-headline-lg-mobile uppercase leading-none">
          Resumen
        </h2>
        <p className="text-title-lg capitalize text-on-surface-variant">
          {nombreMes(stats.mes)}
        </p>
      </header>

      {/* Balance del mes */}
      <div
        className={`card-metal p-5 ${balancePositivo ? 'is-ok' : 'is-danger'}`}
      >
        <span className="text-label-lg font-semibold uppercase text-on-surface-variant">
          Balance del mes
        </span>
        <div
          className={`font-headline text-display-lg leading-none ${
            balancePositivo ? 'text-tertiary' : 'text-error'
          }`}
          style={{ fontSize: '56px' }}
        >
          {formatMoneda(stats.balanceMes)}
        </div>
      </div>

      {/* Ingresos / Gastos del mes */}
      <div className="grid grid-cols-2 gap-4">
        <Tile label="Ingresos del mes" accent="text-tertiary">
          {formatMoneda(stats.ingresosMes)}
        </Tile>
        <Tile label="Gastos del mes" accent="text-primary">
          {formatMoneda(stats.gastosMes)}
        </Tile>
      </div>

      {/* Variación vs mes anterior */}
      {stats.variacionIngresos !== null && (
        <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
          {stats.variacionIngresos >= 0 ? (
            <TrendingUp size={18} className="text-tertiary" />
          ) : (
            <TrendingDown size={18} className="text-error" />
          )}
          Ingresos {stats.variacionIngresos >= 0 ? '+' : ''}
          {stats.variacionIngresos.toFixed(0)}% vs. el mes anterior
        </div>
      )}

      {/* Acumulados */}
      <div className="grid grid-cols-2 gap-4">
        <Tile label="Acumulado total">{formatMoneda(stats.totalIngresos)}</Tile>
        <Tile
          label="Acumulado neto"
          accent={stats.acumuladoNeto >= 0 ? 'text-tertiary' : 'text-error'}
        >
          {formatMoneda(stats.acumuladoNeto)}
        </Tile>
      </div>

      {/* Promedios mensuales */}
      <div className="card-metal p-4">
        <span className="text-label-lg font-semibold uppercase text-on-surface-variant">
          Promedio mensual ({stats.mesesTranscurridos} mes
          {stats.mesesTranscurridos > 1 ? 'es' : ''})
        </span>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-headline text-title-lg text-tertiary">
              {formatMoneda(stats.promedioIngresos)}
            </div>
            <div className="text-label-sm uppercase text-on-surface-variant">
              Ingresos
            </div>
          </div>
          <div>
            <div className="font-headline text-title-lg text-primary">
              {formatMoneda(stats.promedioGastos)}
            </div>
            <div className="text-label-sm uppercase text-on-surface-variant">
              Gastos
            </div>
          </div>
          <div>
            <div className="font-headline text-title-lg">
              {formatMoneda(stats.promedioGanancia)}
            </div>
            <div className="text-label-sm uppercase text-on-surface-variant">
              Ganancia
            </div>
          </div>
        </div>
      </div>

      {/* Socios */}
      <div className="grid grid-cols-2 gap-4">
        <Tile label="Socios activos">
          <span className="flex items-center gap-2">
            <Users size={22} className="text-primary" />
            {stats.sociosActivos}
          </span>
        </Tile>
        <Tile
          label="Deudores"
          accent={stats.deudores > 0 ? 'text-error' : ''}
          onClick={() => navigate('/deudores')}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle
              size={22}
              className={stats.deudores > 0 ? 'text-error' : 'text-on-surface-variant'}
            />
            {stats.deudores}
          </span>
        </Tile>
      </div>

      {/* Gastos por categoría (mes actual) */}
      {stats.gastosPorCategoria.length > 0 && (
        <div className="card-metal p-4">
          <span className="text-label-lg font-semibold uppercase text-on-surface-variant">
            Gastos del mes por categoría
          </span>
          <ul className="mt-3 flex flex-col gap-2.5">
            {stats.gastosPorCategoria.map((c) => (
              <li key={c.categoria}>
                <div className="mb-1 flex justify-between text-body-md">
                  <span>{etiquetaCategoria(c.categoria)}</span>
                  <span className="text-on-surface-variant">
                    {formatMoneda(c.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
                  <div
                    className="h-full rounded-full bg-primary-container"
                    style={{ width: `${(c.total / maxCategoria) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
