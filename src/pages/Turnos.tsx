import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Clock, Pencil, Trash2, Wand2 } from 'lucide-react'
import { db, type Turno } from '../db/db'
import { eliminarTurno, etiquetaTurno, generarTurnosEstandar } from '../db/turnos'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import TurnoForm from '../components/forms/TurnoForm'

export default function Turnos() {
  const navigate = useNavigate()
  const [crear, setCrear] = useState(false)
  const [editando, setEditando] = useState<Turno | null>(null)

  const turnos = useLiveQuery(
    () => db.turnos.filter((t) => !t.eliminado).sortBy('inicio'),
    [],
  )

  async function borrar(t: Turno) {
    if (!confirm(`¿Eliminar el turno ${etiquetaTurno(t)}?`)) return
    await eliminarTurno(t.id)
  }

  async function generar() {
    const n = await generarTurnosEstandar()
    alert(n > 0 ? `${n} turno(s) creado(s).` : 'Ya existen todos los turnos por hora.')
  }

  return (
    <section>
      <button
        onClick={() => navigate('/socios')}
        className="mb-4 flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Socios
      </button>

      <h2 className="mb-4 flex items-center gap-2 font-headline text-headline-md uppercase">
        <Clock size={24} className="text-primary" /> Configurar turnos
      </h2>

      <Button variant="outline" onClick={generar} className="mb-4 w-full">
        <Wand2 size={18} /> Generar turnos por hora (6:00–21:00)
      </Button>

      {turnos && turnos.length === 0 ? (
        <EmptyState
          Icon={Clock}
          title="Sin turnos"
          desc="Genera los turnos por hora o crea uno con el botón +"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(turnos ?? []).map((t) => (
            <li
              key={t.id}
              className="card-metal flex items-center gap-3 p-3.5"
            >
              <span className="flex-1 font-body text-body-lg font-semibold">
                {etiquetaTurno(t)}
              </span>
              <span className="text-label-sm uppercase text-on-surface-variant">
                Cap. {t.capacidad}
              </span>
              <button
                onClick={() => setEditando(t)}
                className="text-on-surface-variant active:scale-90"
                aria-label="Editar"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => borrar(t)}
                className="text-on-surface-variant active:scale-90"
                aria-label="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => setCrear(true)} label="Nuevo turno" />

      <Modal open={crear} title="Nuevo turno" onClose={() => setCrear(false)}>
        <TurnoForm onDone={() => setCrear(false)} />
      </Modal>

      <Modal
        open={editando !== null}
        title="Editar turno"
        onClose={() => setEditando(null)}
      >
        {editando && (
          <TurnoForm turno={editando} onDone={() => setEditando(null)} />
        )}
      </Modal>
    </section>
  )
}
