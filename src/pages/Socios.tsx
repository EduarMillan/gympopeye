import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Users, Search, Clock, Settings2, ChevronRight } from 'lucide-react'
import { db, type Pago } from '../db/db'
import { estadoDeSocio } from '../db/calculos'
import { etiquetaTurno } from '../db/turnos'
import PageHeader from '../components/PageHeader'
import EstadoBadge from '../components/EstadoBadge'
import SocioCard from '../components/SocioCard'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import SocioForm from '../components/forms/SocioForm'

type Vista = 'todos' | 'turnos'

export default function Socios() {
  const navigate = useNavigate()
  const [vista, setVista] = useState<Vista>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [abrirForm, setAbrirForm] = useState(false)

  const socios = useLiveQuery(
    () => db.socios.orderBy('nombre').filter((s) => !s.eliminado).toArray(),
    [],
  )
  const pagos = useLiveQuery(
    () => db.pagos.filter((p) => !p.eliminado).toArray(),
    [],
  )
  const turnos = useLiveQuery(
    () => db.turnos.filter((t) => !t.eliminado).sortBy('inicio'),
    [],
  )

  const pagosPorSocio = useMemo(() => {
    const mapa = new Map<string, Pago[]>()
    for (const p of pagos ?? []) {
      const arr = mapa.get(p.socioId) ?? []
      arr.push(p)
      mapa.set(p.socioId, arr)
    }
    return mapa
  }, [pagos])

  const turnoEtiqueta = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of turnos ?? []) m.set(t.id, etiquetaTurno(t))
    return m
  }, [turnos])

  const esDeudor = (id: string) => {
    const e = estadoDeSocio(pagosPorSocio.get(id) ?? []).estado
    return e === 'vencido' || e === 'sin_pagos'
  }

  const filtrados = (socios ?? []).filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  )

  const sinTurno = (socios ?? []).filter((s) => !s.turnoId).length

  return (
    <section>
      <PageHeader title="Socios" Icon={Users} />

      {/* Pestañas */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded border-2 border-surface-variant p-1">
        {(['todos', 'turnos'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`rounded py-2 font-body text-label-lg font-bold uppercase tracking-wide transition-colors ${
              vista === v ? 'btn-red' : 'text-on-surface-variant'
            }`}
          >
            {v === 'todos' ? 'Todos' : 'Por turno'}
          </button>
        ))}
      </div>

      {vista === 'todos' ? (
        <>
          <div className="relative mb-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar socio…"
              className="w-full rounded border-2 border-surface-variant bg-surface-container-low py-2.5 pl-10 pr-3 text-on-surface outline-none focus:border-primary-container"
            />
          </div>

          {socios && socios.length === 0 ? (
            <EmptyState
              Icon={Users}
              title="Sin socios"
              desc="Agrega tu primer socio con el botón +"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filtrados.map((s) => {
                const { estado } = estadoDeSocio(pagosPorSocio.get(s.id) ?? [])
                const turnoTxt = s.turnoId
                  ? turnoEtiqueta.get(s.turnoId) ?? 'Turno'
                  : 'Sin turno'
                return (
                  <li key={s.id}>
                    <SocioCard
                      nombre={s.nombre}
                      estado={estado}
                      foto={s.foto}
                      subtitle={`${turnoTxt}${!s.activo ? ' · Inactivo' : ''}`}
                      right={<EstadoBadge estado={estado} />}
                      onClick={() => navigate(`/socios/${s.id}`)}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => navigate('/turnos')}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded border-2 border-secondary py-2 font-body text-label-lg font-bold uppercase tracking-wide text-secondary active:scale-95"
          >
            <Settings2 size={16} /> Configurar turnos
          </button>

          {turnos && turnos.length === 0 ? (
            <EmptyState
              Icon={Clock}
              title="Sin turnos"
              desc="Configura los turnos para organizar a tus socios"
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {(turnos ?? []).map((t) => {
                const enTurno = (socios ?? []).filter((s) => s.turnoId === t.id)
                const total = enTurno.length
                const lleno = total >= t.capacidad
                const deudores = enTurno.filter((s) => esDeudor(s.id)).length
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => navigate(`/turnos/${t.id}`)}
                      className={`card-metal ${
                        lleno ? 'is-danger' : ''
                      } flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]`}
                    >
                      <Clock
                        size={22}
                        className={lleno ? 'text-error' : 'text-primary'}
                      />
                      <span className="flex-1">
                        <span className="block font-body text-body-lg font-semibold">
                          {etiquetaTurno(t)}
                        </span>
                        {deudores > 0 && (
                          <span className="text-label-sm uppercase text-error">
                            {deudores} deudor(es)
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-body text-title-lg font-bold tabular-nums ${
                          lleno ? 'text-error' : 'text-on-surface'
                        }`}
                      >
                        {total}/{t.capacidad}
                      </span>
                      <ChevronRight size={20} className="text-on-surface-variant" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {sinTurno > 0 && (
            <p className="mt-3 text-label-sm uppercase text-on-surface-variant">
              {sinTurno} socio(s) sin turno asignado
            </p>
          )}
        </>
      )}

      <Fab onClick={() => setAbrirForm(true)} label="Agregar socio" />

      <Modal
        open={abrirForm}
        title="Nuevo socio"
        onClose={() => setAbrirForm(false)}
      >
        <SocioForm onDone={() => setAbrirForm(false)} />
      </Modal>
    </section>
  )
}
