import { useState } from 'react'
import type { Promocion, TipoPromocion } from '../../db/db'
import { crearPromocion, actualizarPromocion } from '../../db/promociones'
import { TextField, TextArea } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import Button from '../ui/Button'

type Props = {
  promocion?: Promocion
  onDone: () => void
}

const etiquetaValor: Record<TipoPromocion, string> = {
  descuento_porcentaje: 'Porcentaje de descuento (%)',
  descuento_fijo: 'Monto de descuento',
  meses_gratis: 'Meses gratis',
}

export default function PromocionForm({ promocion, onDone }: Props) {
  const [nombre, setNombre] = useState(promocion?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoPromocion>(
    promocion?.tipo ?? 'descuento_porcentaje',
  )
  const [valor, setValor] = useState(String(promocion?.valor ?? ''))
  const [vigenciaDesde, setDesde] = useState(promocion?.vigenciaDesde ?? '')
  const [vigenciaHasta, setHasta] = useState(promocion?.vigenciaHasta ?? '')
  const [activo, setActivo] = useState(promocion?.activo ?? true)
  const [descripcion, setDescripcion] = useState(promocion?.descripcion ?? '')
  const [guardando, setGuardando] = useState(false)

  const valido = nombre.trim() && Number(valor) > 0 && !guardando

  async function guardar() {
    if (!valido) return
    setGuardando(true)
    const datos = {
      nombre: nombre.trim(),
      tipo,
      valor: Number(valor),
      vigenciaDesde: vigenciaDesde || undefined,
      vigenciaHasta: vigenciaHasta || undefined,
      activo,
      descripcion: descripcion.trim() || undefined,
    }
    if (promocion) await actualizarPromocion(promocion.id, datos)
    else await crearPromocion(datos)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Nombre *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej. Plan trimestral"
        autoFocus
      />

      <SelectField
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoPromocion)}
      >
        <option value="descuento_porcentaje">Descuento en %</option>
        <option value="descuento_fijo">Descuento fijo</option>
        <option value="meses_gratis">Meses gratis</option>
      </SelectField>

      <TextField
        label={`${etiquetaValor[tipo]} *`}
        type="number"
        inputMode="decimal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0"
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Vigente desde"
          type="date"
          value={vigenciaDesde}
          onChange={(e) => setDesde(e.target.value)}
        />
        <TextField
          label="Vigente hasta"
          type="date"
          value={vigenciaHasta}
          onChange={(e) => setHasta(e.target.value)}
        />
      </div>

      <label className="flex items-center justify-between rounded border-2 border-surface-variant bg-surface-container-low px-3 py-2.5 text-label-lg font-semibold uppercase tracking-wide text-on-surface-variant">
        Activa
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-5 w-5 accent-primary-container"
        />
      </label>

      <TextArea
        label="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Opcional"
      />

      <Button onClick={guardar} disabled={!valido}>
        {promocion ? 'Guardar cambios' : 'Crear promoción'}
      </Button>
    </div>
  )
}
