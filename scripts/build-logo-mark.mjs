// Derives public/logo-mark.png from public/logo.png:
//   - trims the empty margin so the mark fills its box
//   - turns the white background transparent, keeping antialiased edges
// The source logo.png is not modified.
import sharp from 'sharp'

const SRC = 'public/logo.png'
const OUT = 'public/logo-mark.png'

const trimmed = sharp(SRC).trim({ threshold: 10 })
const { data, info } = await trimmed.removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

// Find the mark's solid colour: the darkest pixel is fully-covered ink.
let ink = [0, 0, 0]
let darkest = Infinity
for (let i = 0; i < data.length; i += channels) {
  const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
  if (lum < darkest) {
    darkest = lum
    ink = [data[i], data[i + 1], data[i + 2]]
  }
}

// A pixel is ink composited on white: p = a*ink + (1-a)*255, so a = (255-p)/(255-ink).
// Use the channel with the widest range for the cleanest alpha.
const spread = ink.map((c) => 255 - c)
const ch = spread.indexOf(Math.max(...spread))
const denom = spread[ch] || 1

const rgba = Buffer.alloc(width * height * 4)
for (let px = 0; px < width * height; px++) {
  const s = px * channels
  const d = px * 4
  const alpha = Math.max(0, Math.min(255, Math.round(((255 - data[s + ch]) / denom) * 255)))
  rgba[d] = ink[0]
  rgba[d + 1] = ink[1]
  rgba[d + 2] = ink[2]
  rgba[d + 3] = alpha
}

await sharp(rgba, { raw: { width, height, channels: 4 } })
  .resize({ width: 512, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(OUT)

const out = await sharp(OUT).metadata()
const hex = '#' + ink.map((c) => c.toString(16).padStart(2, '0')).join('')

console.log('ink colour      :', hex, '(site brown is #8B4513)')
console.log('trimmed to      :', width + ' x ' + height)
console.log('written         :', OUT, out.width + ' x ' + out.height, 'alpha:', out.hasAlpha)

// Corners must now be fully transparent.
const corner = await sharp(OUT).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer()
console.log('corner alpha    :', corner[3], '(0 = transparent)')
