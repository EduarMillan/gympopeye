// Genera los íconos de la PWA a partir de public/logo.png.
//  - pwa-192 / pwa-512: el logo recortado a cuadrado (purpose "any").
//  - pwa-maskable-512: el logo con margen sobre negro (purpose "maskable",
//    para que el recorte circular de Android no corte el badge).
//  - favicon-180 (apple-touch) por comodidad.
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'

const SRC = 'public/logo.png'
const NEGRO = { r: 19, g: 19, b: 19, alpha: 1 }

// Cuadrado recortado (cover).
async function cuadrado(size, salida) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png()
    .toFile(`public/${salida}`)
  console.log(`public/${salida}`)
}

// Con margen sobre fondo (para maskable).
async function maskable(size, salida) {
  const inner = Math.round(size * 0.78)
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: NEGRO })
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: NEGRO },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`public/${salida}`)
  console.log(`public/${salida}`)
}

await cuadrado(192, 'pwa-192x192.png')
await cuadrado(512, 'pwa-512x512.png')
await cuadrado(180, 'apple-touch-icon.png')
await maskable(512, 'pwa-maskable-512x512.png')
