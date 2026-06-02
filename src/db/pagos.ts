import { db, nuevoId, ahora, type Pago } from './db'

export type PagoInput = Omit<Pago, 'id' | 'createdAt' | 'updatedAt'>

export async function registrarPago(data: PagoInput): Promise<Pago> {
  const ts = ahora()
  const pago: Pago = { id: nuevoId(), createdAt: ts, updatedAt: ts, ...data }
  await db.pagos.add(pago)
  return pago
}

export async function eliminarPago(id: string): Promise<void> {
  await db.pagos.update(id, { eliminado: true, updatedAt: ahora() })
}
