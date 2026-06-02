import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { db } from '../db/db'
import {
  crearUsuario,
  obtenerPregunta,
  recuperarPassword,
} from '../db/usuarios'
import { useAuth } from '../auth/AuthContext'
import { supabaseConfigurado } from '../lib/supabase'
import { sincronizar } from '../db/sync'
import { TextField, PasswordField } from '../components/ui/TextField'
import Button from '../components/ui/Button'

type Vista = 'principal' | 'recuperar'

export default function Login() {
  const { login } = useAuth()
  const cantidad = useLiveQuery(
    () => db.usuarios.filter((u) => !u.eliminado).count(),
    [],
  )

  const [vista, setVista] = useState<Vista>('principal')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [password2, setPassword2] = useState('')
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState('')
  // Recuperación
  const [preguntaCargada, setPreguntaCargada] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [chequeoHecho, setChequeoHecho] = useState(false)
  const [comprobando, setComprobando] = useState(false)

  // Si no hay usuarios locales, comprobar en la nube ANTES de ofrecer
  // "crear superadmin": así nadie puede auto-registrarse si el sistema ya
  // está configurado (solo verán iniciar sesión).
  useEffect(() => {
    if (cantidad === undefined || cantidad > 0 || chequeoHecho) return
    if (supabaseConfigurado && navigator.onLine) {
      setComprobando(true)
      sincronizar()
        .catch(() => {})
        .finally(() => {
          setComprobando(false)
          setChequeoHecho(true)
        })
    } else {
      setChequeoHecho(true)
    }
  }, [cantidad, chequeoHecho])

  if (cantidad === undefined) return null // cargando base local

  const verificando = comprobando || (cantidad === 0 && !chequeoHecho)
  const primeraVez = cantidad === 0 && chequeoHecho && !comprobando

  async function entrar() {
    setError('')
    setOcupado(true)
    const ok = await login(usuario, password)
    setOcupado(false)
    if (!ok) setError('Usuario o contraseña incorrectos.')
  }

  async function crearSuperadmin() {
    setError('')
    if (password !== password2) return setError('Las contraseñas no coinciden.')
    if (password.length < 4)
      return setError('La contraseña debe tener al menos 4 caracteres.')
    setOcupado(true)
    await crearUsuario({
      nombre: nombre.trim() || 'Administrador',
      usuario,
      rol: 'superadmin',
      password,
      pregunta: pregunta.trim() || undefined,
      respuesta: respuesta.trim() || undefined,
    })
    await login(usuario, password)
    setOcupado(false)
  }

  async function sincronizarUsuarios() {
    setError('')
    setOcupado(true)
    try {
      await sincronizar()
    } catch (e) {
      setError(`No se pudo sincronizar: ${(e as Error).message}`)
    }
    setOcupado(false)
  }

  // --- Recuperación ---
  async function buscarPregunta() {
    setError('')
    setOcupado(true)
    const res = await obtenerPregunta(usuario)
    setOcupado(false)
    if (!res) {
      setError(
        'Ese usuario no tiene pregunta de seguridad. Pide a un superadmin que restablezca tu contraseña.',
      )
      return
    }
    setPreguntaCargada(res.pregunta)
  }

  async function restablecer() {
    setError('')
    if (password !== password2) return setError('Las contraseñas no coinciden.')
    if (password.length < 4)
      return setError('La contraseña debe tener al menos 4 caracteres.')
    setOcupado(true)
    const ok = await recuperarPassword(usuario, respuesta, password)
    if (!ok) {
      setOcupado(false)
      return setError('Respuesta incorrecta.')
    }
    await login(usuario, password)
    setOcupado(false)
  }

  function irARecuperar() {
    setError('')
    setPassword('')
    setPassword2('')
    setRespuesta('')
    setPreguntaCargada(null)
    setVista('recuperar')
  }

  if (verificando) {
    return (
      <div className="mx-auto flex min-h-svh max-w-sm flex-col items-center justify-center gap-4 px-6">
        <img
          src="/pwa-192x192.png"
          alt="Popeye's Gym"
          className="h-20 w-20 rounded-full ring-1 ring-white/15"
        />
        <p className="flex items-center gap-2 text-on-surface-variant">
          <RefreshCw size={18} className="animate-spin" /> Comprobando…
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/pwa-192x192.png"
          alt="Popeye's Gym"
          className="h-20 w-20 rounded-full ring-1 ring-white/15"
        />
        <h1 className="font-headline text-headline-md uppercase text-primary">
          Popeye&apos;s Gym
        </h1>
      </div>

      <div className="card-metal flex flex-col gap-4 p-5">
        {vista === 'recuperar' ? (
          <>
            <h2 className="font-headline text-title-lg uppercase">
              Recuperar contraseña
            </h2>
            <TextField
              label="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoCapitalize="none"
              disabled={preguntaCargada !== null}
            />

            {preguntaCargada === null ? (
              <Button onClick={buscarPregunta} disabled={!usuario || ocupado}>
                Continuar
              </Button>
            ) : (
              <>
                <div className="rounded border-l-4 border-secondary bg-surface-container-low p-3">
                  <p className="text-label-sm uppercase text-on-surface-variant">
                    Pregunta de seguridad
                  </p>
                  <p className="text-body-md">{preguntaCargada}</p>
                </div>
                <TextField
                  label="Tu respuesta"
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                />
                <PasswordField
                  label="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordField
                  label="Repetir contraseña"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
                <Button
                  onClick={restablecer}
                  disabled={!respuesta || !password || ocupado}
                >
                  Restablecer y entrar
                </Button>
              </>
            )}

            {error && <p className="text-body-md text-error">{error}</p>}

            <button
              onClick={() => {
                setVista('principal')
                setError('')
              }}
              className="flex items-center justify-center gap-1 text-body-md text-on-surface-variant active:scale-95"
            >
              <ArrowLeft size={16} /> Volver
            </button>
          </>
        ) : (
          <>
            <h2 className="font-headline text-title-lg uppercase">
              {primeraVez ? 'Crear superadmin' : 'Iniciar sesión'}
            </h2>

            {primeraVez && (
              <TextField
                label="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
              />
            )}

            <TextField
              label="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoCapitalize="none"
              placeholder="usuario"
            />
            <PasswordField
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {primeraVez && (
              <>
                <PasswordField
                  label="Repetir contraseña"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
                <TextField
                  label="Pregunta de seguridad (para recuperar)"
                  value={pregunta}
                  onChange={(e) => setPregunta(e.target.value)}
                  placeholder="Ej. ¿Nombre de tu primera mascota?"
                />
                <TextField
                  label="Respuesta"
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="La respuesta que recordarás"
                />
              </>
            )}

            {error && <p className="text-body-md text-error">{error}</p>}

            <Button
              onClick={primeraVez ? crearSuperadmin : entrar}
              disabled={!usuario || !password || ocupado}
            >
              {primeraVez ? 'Crear y entrar' : 'Entrar'}
            </Button>

            {!primeraVez && (
              <button
                onClick={irARecuperar}
                className="text-body-md text-on-surface-variant active:scale-95"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </>
        )}
      </div>

      {primeraVez && supabaseConfigurado && vista === 'principal' && (
        <button
          onClick={sincronizarUsuarios}
          disabled={ocupado}
          className="flex items-center justify-center gap-2 text-body-md text-on-surface-variant active:scale-95 disabled:opacity-40"
        >
          <RefreshCw size={16} className={ocupado ? 'animate-spin' : ''} />
          ¿Ya tienes cuenta en otro equipo? Sincronizar
        </button>
      )}
    </div>
  )
}
