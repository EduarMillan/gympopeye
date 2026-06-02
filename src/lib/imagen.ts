// Comprime y redimensiona una imagen antes de guardarla, para que la
// sincronización sea liviana (clave con conexiones malas). Devuelve un
// dataURL JPEG pequeño.

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

/**
 * @param max  lado máximo en px (se mantiene la proporción)
 * @param calidad  0..1 para el JPEG
 */
export async function comprimirImagen(
  file: File,
  max = 400,
  calidad = 0.7,
): Promise<string> {
  const original = await leerArchivo(file)
  if (!file.type.startsWith('image/')) return original

  const img = await cargarImagen(original)
  let { width, height } = img
  if (width > max || height > max) {
    if (width >= height) {
      height = Math.round((height * max) / width)
      width = max
    } else {
      width = Math.round((width * max) / height)
      height = max
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return original
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', calidad)
}
