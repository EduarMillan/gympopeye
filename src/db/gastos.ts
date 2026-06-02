import { db, nuevoId, ahora, type Gasto, type CategoriaGasto } from './db'

export type GastoInput = Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'>

/** Catálogo de categorías para selects y etiquetas. */
export const CATEGORIAS: { valor: CategoriaGasto; etiqueta: string }[] = [
  { valor: 'salario', etiqueta: 'Salario' },
  { valor: 'limpieza', etiqueta: 'Limpieza' },
  { valor: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { valor: 'servicios', etiqueta: 'Servicios (agua, luz…)' },
  { valor: 'equipos', etiqueta: 'Equipos' },
  { valor: 'otros', etiqueta: 'Otros' },
]

export const etiquetaCategoria = (c: CategoriaGasto): string =>
  CATEGORIAS.find((x) => x.valor === c)?.etiqueta ?? c

export async function crearGasto(data: GastoInput): Promise<Gasto> {
  const ts = ahora()
  const gasto: Gasto = { id: nuevoId(), createdAt: ts, updatedAt: ts, ...data }
  await db.gastos.add(gasto)
  return gasto
}

export async function actualizarGasto(
  id: string,
  cambios: Partial<GastoInput>,
): Promise<void> {
  await db.gastos.update(id, { ...cambios, updatedAt: ahora() })
}

export async function eliminarGasto(id: string): Promise<void> {
  await db.gastos.update(id, { eliminado: true, updatedAt: ahora() })
}
