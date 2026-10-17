import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Paleta rosa suave/opaca (rose dessaturado) — elegante, sem o choque do rosa saturado.
const brand: MantineColorsTuple = [
  '#fbf0f3',
  '#f1dde3',
  '#e2b9c6',
  '#d393a7',
  '#c6748d',
  '#bf607d',
  '#bc5675',
  '#a54563',
  '#943b58',
  '#82304c',
]

export const theme = createTheme({
  primaryColor: 'brand',
  colors: { brand },
  defaultRadius: 'lg',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  headings: {
    fontWeight: '800',
  },
})
