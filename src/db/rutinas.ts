import { db, nuevoId, ahora, type Rutina } from './db'

export type RutinaInput = Omit<Rutina, 'id' | 'createdAt' | 'updatedAt'>

export async function crearRutina(data: RutinaInput): Promise<Rutina> {
  const ts = ahora()
  const rutina: Rutina = { id: nuevoId(), createdAt: ts, updatedAt: ts, ...data }
  await db.rutinas.add(rutina)
  return rutina
}

export async function actualizarRutina(
  id: string,
  cambios: Partial<RutinaInput>,
): Promise<void> {
  await db.rutinas.update(id, { ...cambios, updatedAt: ahora() })
}

export async function eliminarRutina(id: string): Promise<void> {
  await db.rutinas.update(id, { eliminado: true, updatedAt: ahora() })
}
