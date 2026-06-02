import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ShieldCheck, UserCog, Pencil, Trash2 } from 'lucide-react'
import { db, type Usuario } from '../db/db'
import { eliminarUsuario } from '../db/usuarios'
import { useAuth } from '../auth/AuthContext'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import UsuarioForm from '../components/forms/UsuarioForm'

export default function Usuarios() {
  const navigate = useNavigate()
  const { usuario: actual } = useAuth()
  const [crear, setCrear] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)

  const usuarios = useLiveQuery(
    () => db.usuarios.filter((u) => !u.eliminado).toArray(),
    [],
  )

  // Solo el superadmin gestiona usuarios.
  if (actual && actual.rol !== 'superadmin') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-on-surface-variant">
          Solo el superadmin puede gestionar usuarios.
        </p>
        <Button variant="outline" onClick={() => navigate('/ajustes')}>
          Volver
        </Button>
      </div>
    )
  }

  async function borrar(u: Usuario) {
    if (u.id === actual?.id) {
      alert('No puedes eliminar tu propio usuario.')
      return
    }
    if (!confirm(`¿Eliminar al usuario "${u.nombre}"?`)) return
    await eliminarUsuario(u.id)
  }

  return (
    <section>
      <button
        onClick={() => navigate('/ajustes')}
        className="mb-4 flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Ajustes
      </button>

      <h2 className="mb-5 flex items-center gap-2 font-headline text-headline-md uppercase">
        <UserCog size={24} className="text-primary" /> Usuarios
      </h2>

      {usuarios && usuarios.length === 0 ? (
        <EmptyState Icon={UserCog} title="Sin usuarios" />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {(usuarios ?? []).map((u) => (
            <li key={u.id} className="card-metal flex items-center gap-3 p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
                {u.rol === 'superadmin' ? (
                  <ShieldCheck size={20} />
                ) : (
                  <UserCog size={20} />
                )}
              </span>
              <span className="flex-1 overflow-hidden">
                <span className="block truncate font-body text-body-lg font-semibold">
                  {u.nombre}
                  {u.id === actual?.id && ' (tú)'}
                </span>
                <span className="text-label-sm uppercase text-on-surface-variant">
                  {u.usuario} · {u.rol === 'superadmin' ? 'Superadmin' : 'Admin'}
                </span>
              </span>
              <button
                onClick={() => setEditando(u)}
                className="text-on-surface-variant active:scale-90"
                aria-label="Editar"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => borrar(u)}
                className="text-on-surface-variant active:scale-90"
                aria-label="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => setCrear(true)} label="Nuevo usuario" />

      <Modal open={crear} title="Nuevo usuario" onClose={() => setCrear(false)}>
        <UsuarioForm onDone={() => setCrear(false)} />
      </Modal>

      <Modal
        open={editando !== null}
        title="Editar usuario"
        onClose={() => setEditando(null)}
      >
        {editando && (
          <UsuarioForm usuario={editando} onDone={() => setEditando(null)} />
        )}
      </Modal>
    </section>
  )
}
