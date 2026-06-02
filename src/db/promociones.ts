import { db, nuevoId, ahora, type Promocion } from './db'

export type PromocionInput = Omit<Promocion, 'id' | 'createdAt' | 'updatedAt'>

export async function crearPromocion(
  data: PromocionInput,
): Promise<Promocion> {
  const ts = ahora()
  const promo: Promocion = { id: nuevoId(), createdAt: ts, updatedAt: ts, ...data }
  await db.promociones.add(promo)
  return promo
}

export async function actualizarPromocion(
  id: string,
  cambios: Partial<PromocionInput>,
): Promise<void> {
  await db.promociones.update(id, { ...cambios, updatedAt: ahora() })
}

export async function eliminarPromocion(id: string): Promise<void> {
  await db.promociones.update(id, { eliminado: true, updatedAt: ahora() })
}
