import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type MetodoPago } from '../../db/db'
import { registrarPago } from '../../db/pagos'
import { aplicarPromocion, promoVigente } from '../../db/calculos'
import { calcularCobro } from '../../db/cobro'
import { diaCobroDe } from '../../db/config'
import { formatFecha, formatMoneda, hoyISO, sumarMeses } from '../../lib/format'
import { TextField, TextArea } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import Button from '../ui/Button'

type Props = {
  socioId?: string
  onDone: () => void
}

export default function PagoForm({ socioId, onDone }: Props) {
  const socios = useLiveQuery(() => db.socios.orderBy('nombre').toArray(), [])
  const pagos = useLiveQuery(() => db.pagos.toArray(), [])
  const promociones = useLiveQuery(() => db.promociones.toArray(), [])
  const config = useLiveQuery(() => db.configuracion.get('app'), [])
  const diaCobro = diaCobroDe(config)

  const vigentes = useMemo(
    () => (promociones ?? []).filter(promoVigente),
    [promociones],
  )

  const [socioSel, setSocioSel] = useState(socioId ?? '')
  const [desde, setDesde] = useState(hoyISO())
  const [promocionId, setPromocionId] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [notas, setNotas] = useState('')
  const [montoStr, setMontoStr] = useState('')
  const [guardando, setGuardando] = useState(false)

  const socio = (socios ?? []).find((s) => s.id === socioSel)
  const precio = socio?.precioMensual ?? 0

  // Cobertura actual del socio = el periodoHasta más lejano de sus pagos.
  const coberturaHasta = useMemo(() => {
    if (!socioSel || !pagos) return null
    const suyos = pagos.filter((p) => p.socioId === socioSel && !p.eliminado)
    if (suyos.length === 0) return null
    return suyos.reduce(
      (max, p) => (p.periodoHasta > max ? p.periodoHasta : max),
      suyos[0].periodoHasta,
    )
  }, [socioSel, pagos])

  const cobro = useMemo(
    () => calcularCobro({ coberturaHasta, diaCobro, precio, desde }),
    [coberturaHasta, diaCobro, precio, desde],
  )

  const promo = vigentes.find((p) => p.id === promocionId)
  const res = aplicarPromocion(cobro.monto, promo)
  const periodoHastaFinal =
    res.mesesBonus > 0
      ? sumarMeses(cobro.periodoHasta, res.mesesBonus)
      : cobro.periodoHasta

  // Sugiere el monto calculado (el usuario puede ajustarlo).
  useEffect(() => {
    setMontoStr(String(res.montoFinal))
  }, [res.montoFinal])

  const esRenovacion = coberturaHasta !== null
  const montoNum = Number(montoStr) || 0
  const valido = socioSel && montoNum > 0 && !guardando

  async function guardar() {
    if (!valido) return
    setGuardando(true)
    await registrarPago({
      socioId: socioSel,
      monto: montoNum,
      fecha: hoyISO(),
      periodoDesde: cobro.periodoDesde,
      periodoHasta: periodoHastaFinal,
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
          value={socioSel}
          onChange={(e) => setSocioSel(e.target.value)}
        >
          <option value="">Selecciona…</option>
          {(socios ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </SelectField>
      )}

      {socioSel && precio <= 0 && (
        <p className="rounded border-2 border-secondary bg-secondary-container/10 p-3 text-body-md text-secondary">
          Este socio no tiene precio mensual. Edítalo en su ficha para calcular
          el cobro automáticamente (igual puedes escribir el monto a mano).
        </p>
      )}

      {/* Fecha de inicio (solo primer pago / sin cobertura) */}
      {socioSel && !esRenovacion && (
        <TextField
          label="Inicio (inscripción)"
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
      )}

      <TextField
        label="Monto a cobrar *"
        type="number"
        inputMode="decimal"
        value={montoStr}
        onChange={(e) => setMontoStr(e.target.value)}
        placeholder="0"
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
      {socioSel && (
        <div className="card-metal is-ok p-4">
          <p className="text-label-lg font-bold uppercase text-on-surface-variant">
            {esRenovacion
              ? 'Mensualidad completa'
              : cobro.esProrrateo
                ? `Prorrateo · ${cobro.dias} de ${cobro.cicloDias} días`
                : 'Mensualidad completa'}
          </p>
          <p className="font-body text-headline-md font-bold tabular-nums text-tertiary">
            {formatMoneda(montoNum)}
          </p>
          {promo && (
            <p className="text-label-sm uppercase text-secondary">
              {promo.nombre} ({res.descripcion})
            </p>
          )}
          <p className="mt-1 text-body-md text-on-surface-variant">
            Cubre del {formatFecha(cobro.periodoDesde)} al{' '}
            {formatFecha(periodoHastaFinal)}
          </p>
        </div>
      )}

      <Button onClick={guardar} disabled={!valido}>
        Registrar pago
      </Button>
    </div>
  )
}
