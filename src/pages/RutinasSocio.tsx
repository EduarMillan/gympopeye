import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Dumbbell, Pencil, Trash2 } from 'lucide-react'
import { db, type Rutina } from '../db/db'
import { eliminarRutina } from '../db/rutinas'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import RutinaForm from '../components/forms/RutinaForm'

export default function RutinasSocio() {
  const { socioId = '' } = useParams()
  const navigate = useNavigate()
  const [crear, setCrear] = useState(false)
  const [editando, setEditando] = useState<Rutina | null>(null)

  const socio = useLiveQuery(() => db.socios.get(socioId), [socioId])
  const rutinas = useLiveQuery(
    () =>
      db.rutinas
        .where('socioId')
        .equals(socioId)
        .and((r) => !r.eliminado)
        .toArray(),
    [socioId],
  )

  if (socio === undefined) return null
  if (socio === null) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-on-surface-variant">Socio no encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/rutinas')}>
          Volver
        </Button>
      </div>
    )
  }

  async function borrar(r: Rutina) {
    if (!confirm(`¿Eliminar la rutina "${r.nombre}"?`)) return
    await eliminarRutina(r.id)
  }

  return (
    <section className="flex flex-col gap-5">
      <button
        onClick={() => navigate('/rutinas')}
        className="flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Rutinas
      </button>

      <h2 className="flex items-center gap-2 font-headline text-headline-md uppercase">
        <Dumbbell size={24} className="text-primary" /> {socio.nombre}
      </h2>

      {rutinas && rutinas.length === 0 ? (
        <EmptyState
          Icon={Dumbbell}
          title="Sin rutinas"
          desc="Crea una rutina con el botón +"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {(rutinas ?? []).map((r) => (
            <li key={r.id} className="card-metal p-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="flex-1 font-headline text-title-lg uppercase">
                  {r.nombre}
                </h3>
                <button
                  onClick={() => setEditando(r)}
                  className="text-on-surface-variant active:scale-90"
                  aria-label="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => borrar(r)}
                  className="text-on-surface-variant active:scale-90"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {r.ejercicios.length === 0 ? (
                <p className="text-body-md text-on-surface-variant/70">
                  Sin ejercicios.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {r.ejercicios.map((ej, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-3 border-b border-surface-variant pb-1.5 last:border-0"
                    >
                      <span className="font-body text-body-md">{ej.nombre}</span>
                      <span className="shrink-0 text-label-sm uppercase text-secondary">
                        {[
                          ej.series ? `${ej.series}×` : '',
                          ej.repeticiones ?? '',
                        ]
                          .join(' ')
                          .trim() || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => setCrear(true)} label="Nueva rutina" />

      <Modal open={crear} title="Nueva rutina" onClose={() => setCrear(false)}>
        <RutinaForm socioId={socio.id} onDone={() => setCrear(false)} />
      </Modal>

      <Modal
        open={editando !== null}
        title="Editar rutina"
        onClose={() => setEditando(null)}
      >
        {editando && (
          <RutinaForm
            socioId={socio.id}
            rutina={editando}
            onDone={() => setEditando(null)}
          />
        )}
      </Modal>
    </section>
  )
}
