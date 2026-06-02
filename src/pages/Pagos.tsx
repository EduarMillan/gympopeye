import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Banknote, Ticket, AlertTriangle, ChevronRight } from 'lucide-react'
import { db } from '../db/db'
import { estadoDeSocio } from '../db/calculos'
import { formatFecha, formatMoneda } from '../lib/format'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Fab from '../components/ui/Fab'
import Modal from '../components/ui/Modal'
import PagoForm from '../components/forms/PagoForm'

export default function Pagos() {
  const navigate = useNavigate()
  const [abrirForm, setAbrirForm] = useState(false)

  const socios = useLiveQuery(() => db.socios.toArray(), [])
  const pagos = useLiveQuery(
    () =>
      db.pagos
        .orderBy('fecha')
        .filter((p) => !p.eliminado)
        .reverse()
        .toArray(),
    [],
  )

  const nombrePorSocio = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of socios ?? []) m.set(s.id, s.nombre)
    return m
  }, [socios])

  // Deudores: socios activos vencidos o sin pagos.
  const deudores = useMemo(() => {
    if (!socios || !pagos) return []
    const porSocio = new Map<string, typeof pagos>()
    for (const p of pagos) {
      const arr = porSocio.get(p.socioId) ?? []
      arr.push(p)
      porSocio.set(p.socioId, arr)
    }
    return socios
      .filter((s) => s.activo && !s.eliminado)
      .map((s) => ({ socio: s, info: estadoDeSocio(porSocio.get(s.id) ?? []) }))
      .filter(
        (x) => x.info.estado === 'vencido' || x.info.estado === 'sin_pagos',
      )
  }, [socios, pagos])

  return (
    <section>
      <PageHeader
        title="Pagos"
        Icon={Banknote}
        action={
          <button
            onClick={() => navigate('/promociones')}
            className="flex items-center gap-1.5 rounded border-2 border-secondary px-3 py-1.5 text-label-lg font-semibold uppercase tracking-wide text-secondary active:scale-95"
          >
            <Ticket size={16} /> Promos
          </button>
        }
      />

      {/* Deudores */}
      {deudores.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 flex items-center gap-2 font-headline text-title-lg uppercase text-error">
            <AlertTriangle size={18} /> Deudores ({deudores.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {deudores.map(({ socio, info }) => (
              <li key={socio.id}>
                <button
                  onClick={() => navigate(`/socios/${socio.id}`)}
                  className="card-metal is-danger flex w-full items-center justify-between p-3.5 text-left transition active:scale-[0.99]"
                >
                  <span>
                    <span className="block font-body text-body-lg font-semibold">
                      {socio.nombre}
                    </span>
                    <span className="text-label-sm uppercase text-on-surface-variant">
                      {info.estado === 'sin_pagos'
                        ? 'Sin pagos'
                        : `Venció el ${formatFecha(info.vencimiento!)}`}
                    </span>
                  </span>
                  <ChevronRight size={20} className="text-on-surface-variant" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagos recientes */}
      <h3 className="mb-2 font-headline text-title-lg uppercase text-on-surface-variant">
        Pagos recientes
      </h3>
      {pagos && pagos.length === 0 ? (
        <EmptyState
          Icon={Banknote}
          title="Sin pagos"
          desc="Registra un pago con el botón +"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(pagos ?? []).map((p) => (
            <li key={p.id}>
              <button
                onClick={() => navigate(`/socios/${p.socioId}`)}
                className="card-metal flex w-full items-center justify-between p-3.5 text-left transition active:scale-[0.99]"
              >
                <span className="overflow-hidden">
                  <span className="block truncate font-body text-body-lg font-semibold">
                    {nombrePorSocio.get(p.socioId) ?? 'Socio eliminado'}
                  </span>
                  <span className="text-label-sm uppercase text-on-surface-variant">
                    {formatFecha(p.fecha)} · hasta {formatFecha(p.periodoHasta)}
                  </span>
                </span>
                <span className="shrink-0 font-headline text-title-lg text-primary">
                  {formatMoneda(p.monto)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => setAbrirForm(true)} label="Registrar pago" />

      <Modal
        open={abrirForm}
        title="Registrar pago"
        onClose={() => setAbrirForm(false)}
      >
        <PagoForm onDone={() => setAbrirForm(false)} />
      </Modal>
    </section>
  )
}
