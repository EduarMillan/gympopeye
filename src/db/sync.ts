import { db } from './db'
import { supabase } from '../lib/supabase'
import { TABLAS } from './backup'

const LAST_SYNC_KEY = 'popeyegym:lastSync'

export const getUltimaSync = (): number =>
  Number(localStorage.getItem(LAST_SYNC_KEY)) || 0

const setUltimaSync = (t: number) =>
  localStorage.setItem(LAST_SYNC_KEY, String(t))

type Registro = {
  tabla: string
  id: string
  datos: { updatedAt?: number }
  updated_at: number
  eliminado: boolean
}

type ConTiempos = { id: string; updatedAt?: number; createdAt?: number; eliminado?: boolean }

/**
 * Sincronización bidireccional con Supabase, basada en una tabla genérica
 * `popeye_registros`. Sube los cambios locales desde la última sync y baja
 * los remotos, resolviendo conflictos por `updated_at` (gana el más reciente).
 */
export async function sincronizar(): Promise<{ subidos: number; bajados: number }> {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const desde = getUltimaSync()
  const marca = Date.now()
  let subidos = 0
  let bajados = 0

  // --- PUSH: cambios locales desde la última sincronización ---
  for (const tabla of TABLAS) {
    const locales = (await db
      .table(tabla)
      .filter((r: ConTiempos) => (r.updatedAt ?? r.createdAt ?? 0) > desde)
      .toArray()) as ConTiempos[]

    if (locales.length === 0) continue

    const filas: Registro[] = locales.map((r) => ({
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

  // --- PULL: cambios remotos desde la última sincronización ---
  const { data, error } = await supabase
    .from('popeye_registros')
    .select('*')
    .gt('updated_at', desde)
  if (error) throw error

  for (const fila of (data ?? []) as Registro[]) {
    const local = (await db.table(fila.tabla).get(fila.id)) as
      | ConTiempos
      | undefined
    if (!local || fila.updated_at > (local.updatedAt ?? 0)) {
      await db.table(fila.tabla).put(fila.datos)
      bajados++
    }
  }

  setUltimaSync(marca)
  return { subidos, bajados }
}
