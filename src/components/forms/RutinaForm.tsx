import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Ejercicio, Rutina } from '../../db/db'
import { crearRutina, actualizarRutina } from '../../db/rutinas'
import { TextField } from '../ui/TextField'
import Button from '../ui/Button'

type Props = {
  socioId: string
  rutina?: Rutina
  onDone: () => void
}

const ejercicioVacio = (): Ejercicio => ({ nombre: '', series: undefined, repeticiones: '' })

export default function RutinaForm({ socioId, rutina, onDone }: Props) {
  const [nombre, setNombre] = useState(rutina?.nombre ?? '')
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>(
    rutina?.ejercicios.length ? rutina.ejercicios : [ejercicioVacio()],
  )
  const [guardando, setGuardando] = useState(false)

  function actualizar(i: number, campo: keyof Ejercicio, valor: string) {
    setEjercicios((prev) =>
      prev.map((ej, idx) =>
        idx === i
          ? {
              ...ej,
              [campo]: campo === 'series' ? Number(valor) || undefined : valor,
            }
          : ej,
      ),
    )
  }

  const agregar = () => setEjercicios((prev) => [...prev, ejercicioVacio()])
  const quitar = (i: number) =>
    setEjercicios((prev) => prev.filter((_, idx) => idx !== i))

  const valido = nombre.trim() && !guardando

  async function guardar() {
    if (!valido) return
    setGuardando(true)
    const limpios = ejercicios.filter((e) => e.nombre.trim())
    const datos = { socioId, nombre: nombre.trim(), ejercicios: limpios }
    if (rutina) await actualizarRutina(rutina.id, datos)
    else await crearRutina(datos)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Nombre de la rutina *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej. Pecho y tríceps"
        autoFocus
      />

      <div className="flex flex-col gap-3">
        <span className="text-label-lg font-semibold uppercase tracking-wide text-on-surface-variant">
          Ejercicios
        </span>
        {ejercicios.map((ej, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 border-l-4 border-primary bg-surface-container-low p-3"
          >
            <div className="flex items-center gap-2">
              <input
                value={ej.nombre}
                onChange={(e) => actualizar(i, 'nombre', e.target.value)}
                placeholder="Ejercicio"
                className="flex-1 rounded border-2 border-surface-variant bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary-container"
              />
              <button
                onClick={() => quitar(i)}
                className="text-on-surface-variant active:scale-90"
                aria-label="Quitar ejercicio"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={ej.series ?? ''}
                onChange={(e) => actualizar(i, 'series', e.target.value)}
                inputMode="numeric"
                placeholder="Series"
                className="w-20 rounded border-2 border-surface-variant bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary-container"
              />
              <input
                value={ej.repeticiones ?? ''}
                onChange={(e) => actualizar(i, 'repeticiones', e.target.value)}
                placeholder="Reps (ej. 10-12)"
                className="flex-1 rounded border-2 border-surface-variant bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary-container"
              />
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={agregar}>
          <Plus size={18} /> Agregar ejercicio
        </Button>
      </div>

      <Button onClick={guardar} disabled={!valido}>
        {rutina ? 'Guardar cambios' : 'Crear rutina'}
      </Button>
    </div>
  )
}
