import { db } from './db'

export const TABLAS = [
  'socios',
  'pagos',
  'asistencias',
  'rutinas',
  'gastos',
  'promociones',
  'turnos',
  'usuarios',
  'configuracion',
] as const

export type Tabla = (typeof TABLAS)[number]

export type Respaldo = {
  app: 'popeyegym'
  version: number
  exportadoEn: number
  datos: Record<Tabla, unknown[]>
}

/** Lee toda la base local y arma el objeto de respaldo. */
export async function exportarRespaldo(): Promise<Respaldo> {
  const datos = {} as Record<Tabla, unknown[]>
  for (const t of TABLAS) datos[t] = await db.table(t).toArray()
  return { app: 'popeyegym', version: 1, exportadoEn: Date.now(), datos }
}

/** Dispara la descarga del respaldo como archivo .json. */
export function descargarRespaldo(r: Respaldo): void {
  const blob = new Blob([JSON.stringify(r)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `popeyegym-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

type ConId = { id: string; updatedAt?: number }

/**
 * Mezcla un respaldo en la base local. Ante el mismo registro, gana el más
 * reciente (mayor `updatedAt`). Devuelve cuántos registros se aplicaron.
 */
export async function importarRespaldo(r: Respaldo): Promise<number> {
  if (r?.app !== 'popeyegym' || !r.datos) {
    throw new Error('El archivo no es un respaldo de Popeye Gym.')
  }
  let cambios = 0
  for (const t of TABLAS) {
    const entrantes = (r.datos[t] ?? []) as ConId[]
    await db.transaction('rw', db.table(t), async () => {
      for (const reg of entrantes) {
        const local = (await db.table(t).get(reg.id)) as ConId | undefined
        if (!local || (reg.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
          await db.table(t).put(reg)
          cambios++
        }
      }
    })
  }
  return cambios
}
