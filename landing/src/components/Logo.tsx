import { brand } from '../branding'

type LogoProps = {
  /** altura do logo em px */
  height?: number
}

// SVG vetorial recortado no bounding box do wordmark. Proporção ~735x151.
const RATIO = 735 / 151

/**
 * Logo do Ageendoo (wordmark com calendário no "o").
 * Usa o SVG vetorial — nítido em qualquer tamanho, fill rosa da marca.
 */
export function Logo({ height = 34 }: LogoProps) {
  return (
    <img
      src="/logo-ageendoo.svg"
      alt={brand.productName}
      style={{
        height,
        width: height * RATIO,
        display: 'block',
      }}
    />
  )
}
