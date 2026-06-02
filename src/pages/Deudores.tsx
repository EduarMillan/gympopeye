import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { db, type Pago } from '../db/db'
import { estadoDeSocio, deudaEstimada } from '../db/calculos'
import { etiquetaTurno } from '../db/turnos'
import { formatMoneda } from '../lib/format'
import EmptyState from '../components/ui/EmptyState'
import SocioCard from '../components/SocioCard'

export default function Deudores() {
  const navigate = useNavigate()

  const socios = useLiveQuery(
    () => db.socios.filter((s) => !s.eliminado).sortBy('nombre'),
    [],
  )
  const pagos = useLiveQuery(
    () => db.pagos.filter((p) => !p.eliminado).toArray(),
    [],
  )
  const turnos = useLiveQuery(
    () => db.turnos.filter((t) => !t.eliminado).toArray(),
    [],
  )

  const pagosPorSocio = useMemo(() => {
    const m = new Map<string, Pago[]>()
    for (const p of pagos ?? []) {
      const arr = m.get(p.socioId) ?? []
      arr.push(p)
      m.set(p.socioId, arr)
    }
    return m
  }, [pagos])

  const turnoEtiqueta = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of turnos ?? []) m.set(t.id, etiquetaTurno(t))
    return m
  }, [turnos])

  const deudores = useMemo(() => {
    return (socios ?? [])
      .filter((s) => s.activo)
      .map((s) => {
        const ps = pagosPorSocio.get(s.id) ?? []
        const estado = estadoDeSocio(ps).estado
        return { socio: s, estado, deuda: deudaEstimada(ps, s.precioMensual) }
      })
      .filter((d) => d.estado === 'vencido' || d.estado === 'sin_pagos')
      .sort((a, b) => (b.deuda?.monto ?? 0) - (a.deuda?.monto ?? 0))
  }, [socios, pagosPorSocio])

  const totalAdeudado = deudores.reduce((a, d) => a + (d.deuda?.monto ?? 0), 0)

  return (
    <section>
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Inicio
      </button>

      <h2 className="mb-1 flex items-center gap-2 font-headline text-headline-md uppercase">
        <AlertTriangle size={24} className="text-error" /> Deudores
      </h2>

      {deudores.length === 0 ? (
        <EmptyState
          Icon={AlertTriangle}
          title="Sin deudores"
          desc="Todos los socios activos están al día 💪"
        />
      ) : (
        <>
          <p className="mb-4 text-body-md text-on-surface-variant">
            {deudores.length} socio(s) · total estimado por cobrar{' '}
            <span className="font-headline text-title-lg text-error">
              {formatMoneda(totalAdeudado)}
            </span>
          </p>

          <ul className="flex flex-col gap-2.5">
            {deudores.map(({ socio, estado, deuda }) => {
              const turnoTxt = socio.turnoId
                ? turnoEtiqueta.get(socio.turnoId) ?? 'Turno'
                : 'Sin turno'
              const subtitle = deuda
                ? `${turnoTxt} · ${deuda.meses} mes(es)`
                : turnoTxt
              return (
                <li key={socio.id}>
                  <SocioCard
                    nombre={socio.nombre}
                    estado={estado}
                    foto={socio.foto}
                    subtitle={subtitle}
                    right={
                      deuda ? (
                        <span className="shrink-0 font-headline text-title-lg text-error">
                          {formatMoneda(deuda.monto)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-label-sm uppercase text-on-surface-variant">
                          Sin pagos
                        </span>
                      )
                    }
                    onClick={() => navigate(`/socios/${socio.id}`)}
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
