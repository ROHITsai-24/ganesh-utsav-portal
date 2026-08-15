// The Unprofessional Players mark.
//
// Uses /logo-mark.png, which is public/logo.png trimmed of its empty margin
// with the white background made transparent, so it sits correctly on the
// light header, the amber footer and the dark games nav alike. Regenerate it
// with `node scripts/build-logo-mark.mjs` after replacing logo.png.
//
// The brand name is rendered as text next to the mark everywhere it appears,
// so the image is decorative and hidden from screen readers to avoid
// announcing the name twice.
const BrandLogo = ({ className = 'h-9 w-9' }) => (
  <img
    src="/logo-mark.png"
    alt=""
    aria-hidden="true"
    className={`shrink-0 object-contain ${className}`}
  />
)

export default BrandLogo
