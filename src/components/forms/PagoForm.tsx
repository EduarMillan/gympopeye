import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type MetodoPago } from '../../db/db'
import { registrarPago } from '../../db/pagos'
import { aplicarPromocion, calcularPeriodo, promoVigente } from '../../db/calculos'
import { formatFecha, formatMoneda, hoyISO } from '../../lib/format'
import { TextField, TextArea } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import Button from '../ui/Button'

type Props = {
  socioId?: string // preseleccionado si viene desde el detalle de un socio
  onDone: () => void
}

export default function PagoForm({ socioId, onDone }: Props) {
  const socios = useLiveQuery(
    () => db.socios.orderBy('nombre').toArray(),
    [],
  )
  const promociones = useLiveQuery(() => db.promociones.toArray(), [])
  const vigentes = useMemo(
    () => (promociones ?? []).filter(promoVigente),
    [promociones],
  )

  const [socio, setSocio] = useState(socioId ?? '')
  const [montoBase, setMontoBase] = useState('')
  const [promocionId, setPromocionId] = useState('')
  const [periodoDesde, setPeriodoDesde] = useState(hoyISO())
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const base = Number(montoBase) || 0
  const promo = vigentes.find((p) => p.id === promocionId)
  const resultado = aplicarPromocion(base, promo)
  const periodo = calcularPeriodo(periodoDesde, resultado.mesesBonus)

  const valido = socio && base > 0 && !guardando

  async function guardar() {
    if (!valido) return
    setGuardando(true)
    await registrarPago({
      socioId: socio,
      monto: resultado.montoFinal,
      fecha: hoyISO(),
      periodoDesde: periodo.periodoDesde,
      periodoHasta: periodo.periodoHasta,
      promocionId: promo?.id,
      metodo,
      notas: notas.trim() || undefined,
    })
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      {!socioId && (
        <SelectField
          label="Socio *"
          value={socio}
          onChange={(e) => setSocio(e.target.value)}
        >
          <option value="">Selecciona…</option>
          {(socios ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </SelectField>
      )}

      <TextField
        label="Monto de la mensualidad *"
        type="number"
        inputMode="decimal"
        value={montoBase}
        onChange={(e) => setMontoBase(e.target.value)}
        placeholder="0"
        autoFocus
      />

      <SelectField
        label="Promoción"
        value={promocionId}
        onChange={(e) => setPromocionId(e.target.value)}
      >
        <option value="">Sin promoción</option>
        {vigentes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Inicio del período"
        type="date"
        value={periodoDesde}
        onChange={(e) => setPeriodoDesde(e.target.value)}
      />

      <SelectField
        label="Método"
        value={metodo}
        onChange={(e) => setMetodo(e.target.value as MetodoPago)}
      >
        <option value="efectivo">Efectivo</option>
        <option value="transferencia">Transferencia</option>
        <option value="otro">Otro</option>
      </SelectField>

      <TextArea
        label="Notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Opcional"
      />

      {/* Resumen del cobro */}
      <div className="border-l-4 border-primary bg-surface-container-low p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-label-lg font-semibold uppercase text-on-surface-variant">
            Cobrar
          </span>
          <span className="font-headline text-headline-md text-primary">
            {formatMoneda(resultado.montoFinal)}
          </span>
        </div>
        {promo && (
          <p className="text-label-sm uppercase text-secondary">
            {promo.nombre} ({resultado.descripcion})
          </p>
        )}
        <p className="mt-1 text-body-md text-on-surface-variant">
          Cubre hasta el {formatFecha(periodo.periodoHasta)}
        </p>
      </div>

      <Button onClick={guardar} disabled={!valido}>
        Registrar pago
      </Button>
    </div>
  )
}
