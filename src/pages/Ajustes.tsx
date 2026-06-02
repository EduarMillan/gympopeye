import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  RefreshCw,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  LogOut,
  UserCog,
  ShieldCheck,
} from 'lucide-react'
import { supabaseConfigurado } from '../lib/supabase'
import { sincronizar, getUltimaSync } from '../db/sync'
import { useAuth } from '../auth/AuthContext'
import {
  exportarRespaldo,
  descargarRespaldo,
  importarRespaldo,
  type Respaldo,
} from '../db/backup'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null

export default function Ajustes() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimaSync, setUltimaSync] = useState(getUltimaSync())
  const [aviso, setAviso] = useState<Aviso>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  async function onSincronizar() {
    setSincronizando(true)
    setAviso(null)
    try {
      const { subidos, bajados } = await sincronizar()
      setUltimaSync(getUltimaSync())
      setAviso({
        tipo: 'ok',
        texto: `Sincronizado: ${subidos} enviados, ${bajados} recibidos.`,
      })
    } catch (e) {
      setAviso({ tipo: 'error', texto: `Error: ${(e as Error).message}` })
    } finally {
      setSincronizando(false)
    }
  }

  async function onExportar() {
    setAviso(null)
    try {
      descargarRespaldo(await exportarRespaldo())
      setAviso({ tipo: 'ok', texto: 'Copia exportada. Compártela por WhatsApp.' })
    } catch (e) {
      setAviso({ tipo: 'error', texto: `Error: ${(e as Error).message}` })
    }
  }

  async function onArchivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reimportar el mismo archivo
    if (!file) return
    setAviso(null)
    try {
      const respaldo = JSON.parse(await file.text()) as Respaldo
      const cambios = await importarRespaldo(respaldo)
      setAviso({ tipo: 'ok', texto: `Importado: ${cambios} registros aplicados.` })
    } catch (err) {
      setAviso({ tipo: 'error', texto: `Error: ${(err as Error).message}` })
    }
  }

  const textoUltimaSync =
    ultimaSync > 0 ? new Date(ultimaSync).toLocaleString('es-CU') : 'Nunca'

  return (
    <section>
      <PageHeader title="Ajustes" Icon={Settings} />

      {/* Cuenta */}
      <div className="card-metal mb-5 flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
          {usuario?.rol === 'superadmin' ? (
            <ShieldCheck size={22} />
          ) : (
            <UserCog size={22} />
          )}
        </span>
        <div className="flex-1 overflow-hidden">
          <p className="truncate font-body text-body-lg font-semibold">
            {usuario?.nombre}
          </p>
          <p className="text-label-sm uppercase text-on-surface-variant">
            {usuario?.rol === 'superadmin' ? 'Superadmin' : 'Admin'}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded border-2 border-error px-3 py-1.5 text-label-lg font-bold uppercase tracking-wide text-error active:scale-95"
        >
          <LogOut size={16} /> Salir
        </button>
      </div>

      {usuario?.rol === 'superadmin' && (
        <button
          onClick={() => navigate('/usuarios')}
          className="card-metal mb-5 flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]"
        >
          <UserCog size={22} className="text-primary" />
          <span className="flex-1 font-body text-body-lg font-semibold">
            Gestionar usuarios
          </span>
          <span className="text-on-surface-variant">›</span>
        </button>
      )}

      {aviso && (
        <div
          className={`mb-4 rounded border-2 p-3 text-body-md ${
            aviso.tipo === 'ok'
              ? 'border-tertiary text-tertiary'
              : 'border-error text-error'
          }`}
        >
          {aviso.texto}
        </div>
      )}

      {/* Sincronización con la nube */}
      <div className="card-metal mb-5 p-4">
        <div className="mb-3 flex items-center gap-2">
          {supabaseConfigurado ? (
            <Cloud size={22} className="text-tertiary" />
          ) : (
            <CloudOff size={22} className="text-on-surface-variant" />
          )}
          <h3 className="flex-1 font-headline text-title-lg uppercase">
            Sincronización
          </h3>
          <span
            className={`flex items-center gap-1 text-label-sm uppercase ${
              online ? 'text-tertiary' : 'text-on-surface-variant'
            }`}
          >
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? 'En línea' : 'Sin conexión'}
          </span>
        </div>

        {supabaseConfigurado ? (
          <>
            <p className="mb-3 text-body-md text-on-surface-variant">
              Última sincronización: {textoUltimaSync}
            </p>
            <Button
              onClick={onSincronizar}
              disabled={sincronizando || !online}
              className="w-full"
            >
              <RefreshCw
                size={18}
                className={sincronizando ? 'animate-spin' : ''}
              />
              {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
            </Button>
          </>
        ) : (
          <p className="text-body-md text-on-surface-variant">
            Supabase no está configurado. Agrega tus claves en{' '}
            <code className="text-primary">.env.local</code> (ver el README) para
            activar la sincronización automática. Mientras tanto, usa la copia
            por archivo de abajo.
          </p>
        )}
      </div>

      {/* Respaldo por archivo */}
      <div className="card-metal p-4">
        <h3 className="mb-1 font-headline text-title-lg uppercase">
          Copia de seguridad
        </h3>
        <p className="mb-4 text-body-md text-on-surface-variant">
          Exporta un archivo para respaldar o para enviarlo a otro teléfono. Al
          importar, los datos se combinan (gana lo más reciente).
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onExportar} className="w-full">
            <Download size={18} /> Exportar copia
          </Button>
          <Button
            variant="outline"
            onClick={() => inputArchivo.current?.click()}
            className="w-full"
          >
            <Upload size={18} /> Importar copia
          </Button>
          <input
            ref={inputArchivo}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onArchivo}
          />
        </div>
      </div>
    </section>
  )
}
