import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { db, type Usuario } from '../db/db'
import { verificarCredenciales } from '../db/usuarios'

const SESSION_KEY = 'popeyegym:usuarioId'

type AuthCtx = {
  usuario: Usuario | null
  cargando: boolean
  login: (usuario: string, password: string) => Promise<boolean>
  logout: () => void
  refrescar: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      setCargando(false)
      return
    }
    db.usuarios.get(id).then((u) => {
      if (u && !u.eliminado) setUsuario(u)
      else localStorage.removeItem(SESSION_KEY)
      setCargando(false)
    })
  }, [])

  async function login(u: string, p: string): Promise<boolean> {
    const found = await verificarCredenciales(u, p)
    if (!found) return false
    localStorage.setItem(SESSION_KEY, found.id)
    setUsuario(found)
    return true
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setUsuario(null)
  }

  async function refrescar() {
    if (!usuario) return
    const u = await db.usuarios.get(usuario.id)
    if (u && !u.eliminado) setUsuario(u)
    else logout()
  }

  return (
    <Ctx.Provider value={{ usuario, cargando, login, logout, refrescar }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return c
}
