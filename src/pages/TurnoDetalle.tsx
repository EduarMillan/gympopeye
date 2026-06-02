import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Clock, Search, UserRound, Pencil } from 'lucide-react'
import { db } from '../db/db'
import { estadoDeSocio } from '../db/calculos'
import { etiquetaTurno } from '../db/turnos'
import PageHeader from '../components/PageHeader'
import EstadoBadge from '../components/EstadoBadge'
import SocioCard from '../components/SocioCard'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import TurnoForm from '../components/forms/TurnoForm'

export default function TurnoDetalle() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [editar, setEditar] = useState(false)

  const turno = useLiveQuery(() => db.turnos.get(id), [id])
  const socios = useLiveQuery(
    () =>
      db.socios
        .where('turnoId')
        .equals(id)
        .and((s) => !s.eliminado)
        .sortBy('nombre'),
    [id],
  )
  const pagos = useLiveQuery(
    () => db.pagos.filter((p) => !p.eliminado).toArray(),
    [],
  )

  const pagosPorSocio = useMemo(() => {
    const m = new Map<string, typeof pagos>()
    for (const p of pagos ?? []) {
      const arr = m.get(p.socioId) ?? []
      arr.push(p)
      m.set(p.socioId, arr)
    }
    return m
  }, [pagos])

  if (!turno) return null
  if (turno.eliminado) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-on-surface-variant">Turno no encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/socios')}>
          Volver
        </Button>
      </div>
    )
  }

  const lista = socios ?? []
  const total = lista.length
  const lleno = total >= turno.capacidad
  const deudores = lista.filter((s) => {
    const e = estadoDeSocio(pagosPorSocio.get(s.id) ?? []).estado
    return e === 'vencido' || e === 'sin_pagos'
  }).length

  const filtrados = lista.filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  )

  return (
    <section>
      <button
        onClick={() => navigate('/socios')}
        className="mb-4 flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Socios
      </button>

      <PageHeader
        title={etiquetaTurno(turno)}
        Icon={Clock}
        action={
          <button
            onClick={() => setEditar(true)}
            aria-label="Editar turno"
            className="text-on-surface-variant active:scale-90"
          >
            <Pencil size={20} />
          </button>
        }
      />

      {/* Ocupación */}
      <div
        className={`card-metal ${
          lleno ? 'is-danger' : 'is-ok'
        } mb-4 flex items-center justify-between p-4`}
      >
        <div>
          <span className="text-label-lg font-semibold uppercase text-on-surface-variant">
            Matrícula
          </span>
          <div
            className={`font-body text-headline-md font-bold tabular-nums ${
              lleno ? 'text-error' : 'text-tertiary'
            }`}
          >
            {total} / {turno.capacidad}
          </div>
        </div>
        {lleno ? (
          <span className="rounded bg-error-container px-3 py-1 font-headline uppercase text-on-error-container">
            Lleno
          </span>
        ) : (
          <span className="text-body-md text-on-surface-variant">
            {turno.capacidad - total} cupo(s)
          </span>
        )}
      </div>

      {deudores > 0 && (
        <p className="mb-3 text-label-lg font-semibold uppercase text-error">
          {deudores} deudor(es) en este turno
        </p>
      )}

      {total === 0 ? (
        <EmptyState
          Icon={UserRound}
          title="Sin socios"
          desc="Asigna este turno a un socio desde su ficha"
        />
      ) : (
        <>
          <div className="relative mb-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en el turno…"
              className="w-full rounded border-2 border-surface-variant bg-surface-container-low py-2.5 pl-10 pr-3 text-on-surface outline-none focus:border-primary-container"
            />
          </div>

          <ul className="flex flex-col gap-2.5">
            {filtrados.map((s) => {
              const { estado } = estadoDeSocio(pagosPorSocio.get(s.id) ?? [])
              return (
                <li key={s.id}>
                  <SocioCard
                    nombre={s.nombre}
                    estado={estado}
                    foto={s.foto}
                    right={<EstadoBadge estado={estado} />}
                    onClick={() => navigate(`/socios/${s.id}`)}
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      <Modal open={editar} title="Editar turno" onClose={() => setEditar(false)}>
        <TurnoForm turno={turno} onDone={() => setEditar(false)} />
      </Modal>
    </section>
  )
}
