import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Ticket, Pencil, Trash2 } from 'lucide-react'
import { db, type Promocion } from '../db/db'
import { eliminarPromocion } from '../db/promociones'
import { promoVigente } from '../db/calculos'
import { formatFecha, formatMoneda } from '../lib/format'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import PromocionForm from '../components/forms/PromocionForm'

function describir(p: Promocion): string {
  switch (p.tipo) {
    case 'descuento_porcentaje':
      return `Descuento del ${p.valor}%`
    case 'descuento_fijo':
      return `Descuento de ${formatMoneda(p.valor)}`
    case 'meses_gratis':
      return `${p.valor} mes(es) gratis`
  }
}

function vigenciaTexto(p: Promocion): string {
  if (p.vigenciaDesde && p.vigenciaHasta)
    return `${formatFecha(p.vigenciaDesde)} → ${formatFecha(p.vigenciaHasta)}`
  if (p.vigenciaHasta) return `Hasta ${formatFecha(p.vigenciaHasta)}`
  if (p.vigenciaDesde) return `Desde ${formatFecha(p.vigenciaDesde)}`
  return 'Sin fecha límite'
}

export default function Promociones() {
  const navigate = useNavigate()
  const [crear, setCrear] = useState(false)
  const [editando, setEditando] = useState<Promocion | null>(null)

  const promociones = useLiveQuery(() => db.promociones.toArray(), [])

  async function borrar(p: Promocion) {
    if (!confirm(`¿Eliminar la promoción "${p.nombre}"?`)) return
    await eliminarPromocion(p.id)
  }

  return (
    <section>
      <button
        onClick={() => navigate('/pagos')}
        className="mb-4 flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Pagos
      </button>

      <h2 className="mb-5 flex items-center gap-2 font-headline text-headline-md uppercase">
        <Ticket size={24} className="text-primary" /> Promociones
      </h2>

      {promociones && promociones.length === 0 ? (
        <EmptyState
          Icon={Ticket}
          title="Sin promociones"
          desc="Crea una promoción con el botón +"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(promociones ?? []).map((p) => {
            const vigente = promoVigente(p)
            return (
              <li
                key={p.id}
                className="card-metal flex items-center gap-3 p-3.5"
              >
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-body text-body-lg font-semibold">
                      {p.nombre}
                    </span>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-label-sm font-semibold uppercase ${
                        vigente
                          ? 'bg-tertiary-container text-on-tertiary'
                          : 'border-2 border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      {vigente ? 'Vigente' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-label-sm uppercase text-secondary">
                    {describir(p)}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    {vigenciaTexto(p)}
                  </p>
                </div>
                <button
                  onClick={() => setEditando(p)}
                  className="text-on-surface-variant active:scale-90"
                  aria-label="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => borrar(p)}
                  className="text-on-surface-variant active:scale-90"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Fab onClick={() => setCrear(true)} label="Nueva promoción" />

      <Modal open={crear} title="Nueva promoción" onClose={() => setCrear(false)}>
        <PromocionForm onDone={() => setCrear(false)} />
      </Modal>

      <Modal
        open={editando !== null}
        title="Editar promoción"
        onClose={() => setEditando(null)}
      >
        {editando && (
          <PromocionForm
            promocion={editando}
            onDone={() => setEditando(null)}
          />
        )}
      </Modal>
    </section>
  )
}
