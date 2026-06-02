import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, Search, UserRound, ChevronRight } from 'lucide-react'
import { db } from '../db/db'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/ui/EmptyState'

export default function Rutinas() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  const socios = useLiveQuery(
    () => db.socios.orderBy('nombre').filter((s) => !s.eliminado).toArray(),
    [],
  )
  const rutinas = useLiveQuery(
    () => db.rutinas.filter((r) => !r.eliminado).toArray(),
    [],
  )

  const conteoPorSocio = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rutinas ?? []) m.set(r.socioId, (m.get(r.socioId) ?? 0) + 1)
    return m
  }, [rutinas])

  const filtrados = (socios ?? []).filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  )

  return (
    <section>
      <PageHeader title="Rutinas" Icon={Dumbbell} />

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
          Icon={UserRound}
          title="Sin socios"
          desc="Agrega socios para asignarles rutinas"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtrados.map((s) => {
            const n = conteoPorSocio.get(s.id) ?? 0
            return (
              <li key={s.id}>
                <button
                  onClick={() => navigate(`/rutinas/${s.id}`)}
                  className="flex w-full items-center gap-3 rounded border-2 border-surface-variant bg-surface-container p-3 text-left active:bg-surface-container-high"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-on-surface-variant">
                    {s.foto ? (
                      <img
                        src={s.foto}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={22} />
                    )}
                  </span>
                  <span className="flex-1 overflow-hidden">
                    <span className="block truncate font-body text-body-lg font-semibold">
                      {s.nombre}
                    </span>
                    <span className="text-label-sm uppercase text-on-surface-variant">
                      {n === 0 ? 'Sin rutinas' : `${n} rutina(s)`}
                    </span>
                  </span>
                  <ChevronRight size={20} className="text-on-surface-variant" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
