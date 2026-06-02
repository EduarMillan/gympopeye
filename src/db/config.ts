import { db, ahora, type Configuracion } from './db'

export const CONFIG_ID = 'app'
export const DIA_COBRO_DEFAULT = 1

export async function guardarDiaCobro(diaCobro: number): Promise<void> {
  await db.configuracion.put({ id: CONFIG_ID, diaCobro, updatedAt: ahora() })
}

export function diaCobroDe(config: Configuracion | undefined): number {
  return config?.diaCobro ?? DIA_COBRO_DEFAULT
}
