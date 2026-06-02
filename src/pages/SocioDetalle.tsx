import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  UserRound,
  Phone,
  CalendarDays,
  CalendarCheck,
  Clock,
} from 'lucide-react'
import { db } from '../db/db'
import { estadoDeSocio } from '../db/calculos'
import { etiquetaTurno } from '../db/turnos'
import { mesActual, mesDe } from '../lib/format'
import { eliminarSocio } from '../db/socios'
import { eliminarPago } from '../db/pagos'
import { formatFecha, formatMoneda } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SocioForm from '../components/forms/SocioForm'
import PagoForm from '../components/forms/PagoForm'

export default function SocioDetalle() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [editar, setEditar] = useState(false)
  const [nuevoPago, setNuevoPago] = useState(false)

  const socio = useLiveQuery(() => db.socios.get(id), [id])
  const pagos = useLiveQuery(
    () =>
      db.pagos
        .where('socioId')
        .equals(id)
        .and((p) => !p.eliminado)
        .sortBy('fecha'),
    [id],
  )
  // Más reciente primero para mostrar el historial.
  const historial = pagos ? [...pagos].reverse() : []
  const promociones = useLiveQuery(() => db.promociones.toArray(), [])
  const turno = useLiveQuery(
    async () => (socio?.turnoId ? db.turnos.get(socio.turnoId) : undefined),
    [socio?.turnoId],
  )
  const asistencias = useLiveQuery(
    () =>
      db.asistencias
        .where('socioId')
        .equals(id)
        .and((a) => !a.eliminado)
        .toArray(),
    [id],
  )

  // Asistencias ordenadas (más reciente primero) y conteo del mes.
  const asisOrden = [...(asistencias ?? [])].sort((a, b) =>
    b.dia.localeCompare(a.dia),
  )
  const asisMes = asisOrden.filter((a) => mesDe(a.dia) === mesActual()).length

  if (socio === undefined) return null // cargando
  if (socio === null) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-on-surface-variant">Socio no encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/socios')}>
          Volver
        </Button>
      </div>
    )
  }

  const info = estadoDeSocio(pagos ?? [])
  const nombrePromo = (pid?: string) =>
    promociones?.find((p) => p.id === pid)?.nombre

  async function borrar() {
    if (!confirm(`¿Eliminar a ${socio!.nombre} y todo su historial?`)) return
    await eliminarSocio(socio!.id)
    navigate('/socios')
  }

  async function borrarPago(pid: string) {
    if (!confirm('¿Eliminar este pago?')) return
    await eliminarPago(pid)
  }

  return (
    <section className="flex flex-col gap-5">
      <button
        onClick={() => navigate('/socios')}
        className="flex w-fit items-center gap-1 text-on-surface-variant active:scale-95"
      >
        <ArrowLeft size={20} /> Socios
      </button>

      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface-variant bg-surface-container-high text-on-surface-variant">
          {socio.foto ? (
            <img src={socio.foto} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={36} />
          )}
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-headline text-headline-md uppercase leading-none">
            {socio.nombre}
          </h2>
          <div className="flex items-center gap-2">
            <EstadoBadge estado={info.estado} />
            {!socio.activo && (
              <span className="text-label-sm uppercase text-on-surface-variant">
                Inactivo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Datos */}
      <div className="card-metal flex flex-col gap-2 p-4 text-body-md">
        {socio.telefono && (
          <p className="flex items-center gap-2">
            <Phone size={16} className="text-primary" /> {socio.telefono}
          </p>
        )}
        {turno && (
          <p className="flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Turno{' '}
            {etiquetaTurno(turno)}
          </p>
        )}
        {socio.precioMensual != null && (
          <p className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" /> Mensualidad{' '}
            {formatMoneda(socio.precioMensual)}
          </p>
        )}
        <p className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" /> Inscrito el{' '}
          {formatFecha(socio.fechaInscripcion)}
        </p>
        {info.vencimiento && (
          <p className="text-on-surface-variant">
            Cubierto hasta el {formatFecha(info.vencimiento)}
          </p>
        )}
        {socio.notas && (
          <p className="text-on-surface-variant">{socio.notas}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setNuevoPago(true)}>
          <Plus size={18} /> Pago
        </Button>
        <Button variant="outline" onClick={() => setEditar(true)}>
          <Pencil size={18} /> Editar
        </Button>
        <Button variant="danger" onClick={borrar}>
          <Trash2 size={18} />
        </Button>
      </div>

      {/* Asistencias */}
      <div className="card-metal p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-headline text-title-lg uppercase">
            <CalendarCheck size={18} className="text-tertiary" /> Asistencias
          </h3>
          <span className="text-body-md text-on-surface-variant">
            {asisMes} este mes · {asisOrden.length} total
          </span>
        </div>
        {asisOrden.length === 0 ? (
          <p className="text-body-md text-on-surface-variant/70">
            Aún no tiene asistencias registradas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {asisOrden.slice(0, 12).map((a) => (
              <span
                key={a.id}
                className="rounded bg-surface-container-high px-2 py-1 text-label-sm text-on-surface-variant"
              >
                {formatFecha(a.dia)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div>
        <h3 className="mb-2 font-headline text-title-lg uppercase text-on-surface-variant">
          Historial de pagos
        </h3>
        {pagos && pagos.length === 0 ? (
          <p className="text-body-md text-on-surface-variant/70">
            Aún no hay pagos registrados.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historial.map((p) => (
              <li
                key={p.id}
                className="card-metal flex items-center justify-between p-3.5"
              >
                <div>
                  <p className="font-body text-body-lg font-semibold">
                    {formatMoneda(p.monto)}
                  </p>
                  <p className="text-label-sm uppercase text-on-surface-variant">
                    {formatFecha(p.fecha)} · hasta{' '}
                    {formatFecha(p.periodoHasta)}
                    {nombrePromo(p.promocionId) &&
                      ` · ${nombrePromo(p.promocionId)}`}
                  </p>
                </div>
                <button
                  onClick={() => borrarPago(p.id)}
                  className="text-on-surface-variant active:scale-90"
                  aria-label="Eliminar pago"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={editar} title="Editar socio" onClose={() => setEditar(false)}>
        <SocioForm socio={socio} onDone={() => setEditar(false)} />
      </Modal>

      <Modal
        open={nuevoPago}
        title="Registrar pago"
        onClose={() => setNuevoPago(false)}
      >
        <PagoForm socioId={socio.id} onDone={() => setNuevoPago(false)} />
      </Modal>
    </section>
  )
}
