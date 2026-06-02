import { db } from './db'
import { supabase } from '../lib/supabase'
import { TABLAS } from './backup'

// Marca local solo para mostrar "última sincronización".
const K_AT = 'popeyegym:lastSyncAt'
// Marca local (reloj de ESTE equipo) para saber qué subir.
const K_PUSH = 'popeyegym:lastPush'
// Cursor de bajada = marca del SERVIDOR (server_at) ya procesada.
const K_PULL = 'popeyegym:lastPull'
const EPOCA = '1970-01-01T00:00:00Z'

export const getUltimaSync = (): number =>
  Number(localStorage.getItem(K_AT)) || 0

type Registro = {
  tabla: string
  id: string
  datos: { updatedAt?: number }
  updated_at: number
  eliminado: boolean
  server_at: string
}

type ConTiempos = { id: string; updatedAt?: number; createdAt?: number; eliminado?: boolean }

/**
 * Sincronización bidireccional con Supabase.
 *  - Subida: registros locales modificados desde la última subida (reloj local).
 *  - Bajada: registros con `server_at` (hora del SERVIDOR) posterior al último
 *    cursor procesado → inmune a diferencias de reloj entre dispositivos.
 *  - Conflictos: gana el `updated_at` más reciente (last-write-wins).
 */
export async function sincronizar(): Promise<{ subidos: number; bajados: number }> {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const pushDesde = Number(localStorage.getItem(K_PUSH)) || 0
  const pullDesde = localStorage.getItem(K_PULL) || EPOCA
  const marca = Date.now()
  let subidos = 0
  let bajados = 0

  // --- SUBIDA: cambios locales desde la última subida ---
  for (const tabla of TABLAS) {
    const locales = (await db
      .table(tabla)
      .filter((r: ConTiempos) => (r.updatedAt ?? r.createdAt ?? 0) > pushDesde)
      .toArray()) as ConTiempos[]

    if (locales.length === 0) continue

    const filas = locales.map((r) => ({
      tabla,
      id: r.id,
      datos: r,
      updated_at: r.updatedAt ?? r.createdAt ?? marca,
      eliminado: !!r.eliminado,
    }))

    const { error } = await supabase
      .from('popeye_registros')
      .upsert(filas, { onConflict: 'tabla,id' })
    if (error) throw error
    subidos += filas.length
  }
  localStorage.setItem(K_PUSH, String(marca))

  // --- BAJADA: registros con server_at posterior al cursor ---
  const { data, error } = await supabase
    .from('popeye_registros')
    .select('*')
    .gt('server_at', pullDesde)
    .order('server_at', { ascending: true })
  if (error) throw error

  let maxServer = pullDesde
  for (const fila of (data ?? []) as Registro[]) {
    const local = (await db.table(fila.tabla).get(fila.id)) as
      | ConTiempos
      | undefined
    if (!local || fila.updated_at > (local.updatedAt ?? 0)) {
      await db.table(fila.tabla).put(fila.datos)
      bajados++
    }
    if (fila.server_at > maxServer) maxServer = fila.server_at
  }
  localStorage.setItem(K_PULL, maxServer)
  localStorage.setItem(K_AT, String(marca))

  return { subidos, bajados }
}
