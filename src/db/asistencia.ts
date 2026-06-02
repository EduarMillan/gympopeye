import { db, nuevoId, ahora, type Asistencia } from './db'

/**
 * Alterna la entrada de un socio en un día: si ya estaba registrada la quita,
 * si no, la registra. Devuelve el nuevo estado (true = presente).
 */
export async function toggleAsistencia(
  socioId: string,
  dia: string,
): Promise<boolean> {
  const existente = await db.asistencias
    .where('[socioId+dia]')
    .equals([socioId, dia])
    .first()
  const ts = ahora()

  if (existente) {
    // Borrado suave reversible: alterna el flag `eliminado`.
    const presente = !existente.eliminado
    await db.asistencias.update(existente.id, {
      eliminado: presente,
      updatedAt: ts,
    })
    return !presente
  }

  const asistencia: Asistencia = {
    id: nuevoId(),
    socioId,
    dia,
    createdAt: ts,
    updatedAt: ts,
  }
  await db.asistencias.add(asistencia)
  return true
}
