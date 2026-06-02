import { db, nuevoId, ahora, type Socio } from './db'

export type SocioInput = Omit<Socio, 'id' | 'createdAt' | 'updatedAt'>

export async function crearSocio(data: SocioInput): Promise<Socio> {
  const ts = ahora()
  const socio: Socio = { id: nuevoId(), createdAt: ts, updatedAt: ts, ...data }
  await db.socios.add(socio)
  return socio
}

export async function actualizarSocio(
  id: string,
  cambios: Partial<SocioInput>,
): Promise<void> {
  await db.socios.update(id, { ...cambios, updatedAt: ahora() })
}

/**
 * Borrado suave: marca el socio como eliminado (deja de aparecer en listas)
 * pero conserva su historial de pagos para la contabilidad. El borrado se
 * sincroniza igual que cualquier otro cambio.
 */
export async function eliminarSocio(id: string): Promise<void> {
  await db.socios.update(id, { eliminado: true, updatedAt: ahora() })
}
