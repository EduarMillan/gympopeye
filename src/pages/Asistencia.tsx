import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LogIn, Search, Check, UserRound } from 'lucide-react'
import { db } from '../db/db'
import { toggleAsistencia } from '../db/asistencia'
import { formatFecha, hoyISO } from '../lib/format'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/ui/EmptyState'

// '' = todos los turnos · 'sin' = sin turno · otro = id de turno
type Filtro = string

export default function Asistencia() {
  const [dia, setDia] = useState(hoyISO())
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('')

  const socios = useLiveQuery(
    () => db.socios.filter((s) => s.activo && !s.eliminado).sortBy('nombre'),
    [],
  )
  const asistencias = useLiveQuery(
    () =>
      db.asistencias
        .where('dia')
        .equals(dia)
        .and((a) => !a.eliminado)
        .toArray(),
    [dia],
  )
  const turnos = useLiveQuery(
    () => db.turnos.filter((t) => !t.eliminado).sortBy('inicio'),
    [],
  )

  const presentes = useMemo(
    () => new Set((asistencias ?? []).map((a) => a.socioId)),
    [asistencias],
  )

  // Aplica filtro de turno y búsqueda.
  const porTurno = (socios ?? []).filter((s) => {
    if (filtro === '') return true
    if (filtro === 'sin') return !s.turnoId
    return s.turnoId === filtro
  })
  const filtrados = porTurno.filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  )
  const presentesEnFiltro = porTurno.filter((s) => presentes.has(s.id)).length

  const chips: { valor: Filtro; texto: string }[] = [
    { valor: '', texto: 'Todos' },
    ...(turnos ?? []).map((t) => ({ valor: t.id, texto: t.inicio })),
    { valor: 'sin', texto: 'Sin turno' },
  ]

  return (
    <section>
      <PageHeader title="Entradas" Icon={LogIn} />

      {/* Selector de día + contador del filtro actual */}
      <div className="card-metal mb-4 flex items-center gap-3 p-3">
        <input
          type="date"
          value={dia}
          max={hoyISO()}
          onChange={(e) => setDia(e.target.value)}
          className="flex-1 rounded border-2 border-surface-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary-container"
        />
        <div className="text-right">
          <div className="font-body text-headline-md font-bold tabular-nums leading-none text-primary">
            {presentesEnFiltro}/{porTurno.length}
          </div>
          <div className="text-label-sm uppercase text-on-surface-variant">
            Presentes
          </div>
        </div>
      </div>

      {/* Chips de turno */}
      {turnos && turnos.length > 0 && (
        <div className="-mx-page mb-3 flex gap-2 overflow-x-auto px-page pb-1">
          {chips.map((c) => (
            <button
              key={c.valor || 'todos'}
              onClick={() => setFiltro(c.valor)}
              className={`shrink-0 rounded-full px-3 py-1.5 font-body text-label-lg font-bold tabular-nums uppercase transition-colors ${
                filtro === c.valor
                  ? 'btn-red'
                  : 'border-2 border-surface-variant text-on-surface-variant'
              }`}
            >
              {c.texto}
            </button>
          ))}
        </div>
      )}

      <p className="mb-3 text-label-sm uppercase text-on-surface-variant">
        {formatFecha(dia)} · toca un socio para marcar su entrada
      </p>

      {/* Buscador */}
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

      {porTurno.length === 0 ? (
        <EmptyState
          Icon={UserRound}
          title="Sin socios"
          desc={
            filtro === ''
              ? 'Agrega socios en la sección Socios'
              : 'No hay socios en este turno'
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtrados.map((s) => {
            const presente = presentes.has(s.id)
            return (
              <li key={s.id}>
                <button
                  onClick={() => toggleAsistencia(s.id, dia)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                    presente
                      ? 'border-tertiary bg-tertiary-container/15'
                      : 'border-surface-variant bg-surface-container active:bg-surface-container-high'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-on-surface-variant">
                    {s.foto ? (
                      <img
                        src={s.foto}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={20} />
                    )}
                  </span>
                  <span className="flex-1 truncate font-body text-body-lg font-semibold">
                    {s.nombre}
                  </span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                      presente
                        ? 'border-tertiary bg-tertiary text-on-tertiary'
                        : 'border-outline-variant text-transparent'
                    }`}
                  >
                    <Check size={18} strokeWidth={3} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
