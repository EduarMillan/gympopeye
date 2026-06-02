import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Receipt, Pencil, Trash2, Copy, RefreshCw } from 'lucide-react'
import { db, type Gasto } from '../db/db'
import {
  crearGasto,
  eliminarGasto,
  etiquetaCategoria,
} from '../db/gastos'
import {
  formatFecha,
  formatMoneda,
  hoyISO,
  mesActual,
  mesDe,
  nombreMes,
} from '../lib/format'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import GastoForm from '../components/forms/GastoForm'

export default function Gastos() {
  const [crear, setCrear] = useState(false)
  const [editando, setEditando] = useState<Gasto | null>(null)

  const gastos = useLiveQuery(
    () =>
      db.gastos
        .orderBy('fecha')
        .filter((g) => !g.eliminado)
        .reverse()
        .toArray(),
    [],
  )

  const totalMes = useMemo(() => {
    const mes = mesActual()
    return (gastos ?? [])
      .filter((g) => mesDe(g.fecha) === mes)
      .reduce((a, g) => a + g.monto, 0)
  }, [gastos])

  async function borrar(g: Gasto) {
    if (!confirm('¿Eliminar este gasto?')) return
    await eliminarGasto(g.id)
  }

  /** Duplica un gasto con fecha de hoy (útil para salarios mensuales). */
  async function duplicar(g: Gasto) {
    await crearGasto({
      categoria: g.categoria,
      monto: g.monto,
      fecha: hoyISO(),
      descripcion: g.descripcion,
      esRecurrente: g.esRecurrente,
    })
  }

  return (
    <section>
      <PageHeader title="Gastos" Icon={Receipt} />

      {/* Total del mes */}
      <div className="card-metal mb-5 p-4">
        <p className="text-label-lg font-semibold uppercase text-on-surface-variant">
          Gastos de {nombreMes(mesActual())}
        </p>
        <p className="font-headline text-headline-lg-mobile text-primary">
          {formatMoneda(totalMes)}
        </p>
      </div>

      {gastos && gastos.length === 0 ? (
        <EmptyState
          Icon={Receipt}
          title="Sin gastos"
          desc="Registra un gasto con el botón +"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(gastos ?? []).map((g) => (
            <li
              key={g.id}
              className="card-metal flex items-center gap-3 p-3.5"
            >
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="truncate font-body text-body-lg font-semibold">
                    {etiquetaCategoria(g.categoria)}
                  </span>
                  {g.esRecurrente && (
                    <RefreshCw size={14} className="shrink-0 text-secondary" />
                  )}
                </div>
                <p className="text-label-sm uppercase text-on-surface-variant">
                  {formatFecha(g.fecha)}
                  {g.descripcion ? ` · ${g.descripcion}` : ''}
                </p>
              </div>
              <span className="shrink-0 font-headline text-title-lg text-primary">
                {formatMoneda(g.monto)}
              </span>
              <div className="flex shrink-0 flex-col gap-1.5 text-on-surface-variant">
                <button
                  onClick={() => duplicar(g)}
                  className="active:scale-90"
                  aria-label="Duplicar a hoy"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setEditando(g)}
                  className="active:scale-90"
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => borrar(g)}
                  className="active:scale-90"
                  aria-label="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => setCrear(true)} label="Agregar gasto" />

      <Modal open={crear} title="Nuevo gasto" onClose={() => setCrear(false)}>
        <GastoForm onDone={() => setCrear(false)} />
      </Modal>

      <Modal
        open={editando !== null}
        title="Editar gasto"
        onClose={() => setEditando(null)}
      >
        {editando && (
          <GastoForm gasto={editando} onDone={() => setEditando(null)} />
        )}
      </Modal>
    </section>
  )
}
