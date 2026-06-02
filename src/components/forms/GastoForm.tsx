import { useState } from 'react'
import type { Gasto, CategoriaGasto } from '../../db/db'
import { crearGasto, actualizarGasto, CATEGORIAS } from '../../db/gastos'
import { hoyISO } from '../../lib/format'
import { TextField, TextArea } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import Button from '../ui/Button'

type Props = {
  gasto?: Gasto
  onDone: () => void
}

export default function GastoForm({ gasto, onDone }: Props) {
  const [categoria, setCategoria] = useState<CategoriaGasto>(
    gasto?.categoria ?? 'salario',
  )
  const [monto, setMonto] = useState(String(gasto?.monto ?? ''))
  const [fecha, setFecha] = useState(gasto?.fecha ?? hoyISO())
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? '')
  const [esRecurrente, setRecurrente] = useState(gasto?.esRecurrente ?? false)
  const [guardando, setGuardando] = useState(false)

  const valido = Number(monto) > 0 && !guardando

  async function guardar() {
    if (!valido) return
    setGuardando(true)
    const datos = {
      categoria,
      monto: Number(monto),
      fecha,
      descripcion: descripcion.trim() || undefined,
      esRecurrente,
    }
    if (gasto) await actualizarGasto(gasto.id, datos)
    else await crearGasto(datos)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Categoría"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
      >
        {CATEGORIAS.map((c) => (
          <option key={c.valor} value={c.valor}>
            {c.etiqueta}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Monto *"
        type="number"
        inputMode="decimal"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="0"
        autoFocus
      />

      <TextField
        label="Fecha"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />

      <TextArea
        label="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Ej. Salario de entrenador (junio)"
      />

      <label className="flex items-center justify-between rounded border-2 border-surface-variant bg-surface-container-low px-3 py-2.5 text-label-lg font-semibold uppercase tracking-wide text-on-surface-variant">
        Gasto recurrente (mensual)
        <input
          type="checkbox"
          checked={esRecurrente}
          onChange={(e) => setRecurrente(e.target.checked)}
          className="h-5 w-5 accent-primary-container"
        />
      </label>

      <Button onClick={guardar} disabled={!valido}>
        {gasto ? 'Guardar cambios' : 'Agregar gasto'}
      </Button>
    </div>
  )
}
