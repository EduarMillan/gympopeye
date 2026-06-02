import { db, nuevoId, ahora, type Turno } from './db'

export type TurnoInput = Omit<Turno, 'id' | 'createdAt' | 'updatedAt'>

export const etiquetaTurno = (t: Turno): string => `${t.inicio} - ${t.fin}`

export async function crearTurno(data: TurnoInput): Promise<Turno> {
  const ts = ahora()
  const turno: Turno = { id: nuevoId(), createdAt: ts, updatedAt: ts, ...data }
  await db.turnos.add(turno)
  return turno
}

export async function actualizarTurno(
  id: string,
  cambios: Partial<TurnoInput>,
): Promise<void> {
  await db.turnos.update(id, { ...cambios, updatedAt: ahora() })
}

export async function eliminarTurno(id: string): Promise<void> {
  await db.turnos.update(id, { eliminado: true, updatedAt: ahora() })
}

/**
 * Genera los turnos por hora de 06:00 a 21:00 que aún no existan
 * (con capacidad por defecto). No duplica los ya creados.
 */
export async function generarTurnosEstandar(
  capacidad = 20,
): Promise<number> {
  const existentes = await db.turnos
    .filter((t) => !t.eliminado)
    .toArray()
  const inicios = new Set(existentes.map((t) => t.inicio))

  let creados = 0
  for (let h = 6; h <= 20; h++) {
    const inicio = `${String(h).padStart(2, '0')}:00`
    const fin = `${String(h + 1).padStart(2, '0')}:00`
    if (inicios.has(inicio)) continue
    await crearTurno({ inicio, fin, capacidad })
    creados++
  }
  return creados
}
