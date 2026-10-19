import type { ClientModule } from 'claude-code'

// What the hooks module hands this receipt: its line, and the coin to draw in front of it
// (null where the hooks module draws the coin itself, as an SVG in the Desktop app).
export type ReceiptProps = { line: string; coin: string | null; coinColor: string }

// How lit the receipt is (0 at rest, 1 fully lit) and where it is heading.
type Glow = { level: number; target: number }

// The receipt rests in a dim grey and, under the pointer, rises to pale blue-white, like moonlight.
const REST = [0x8b, 0x90, 0x99]
const LIT = [0xea, 0xf0, 0xff]
// One frame, and how long the glow takes to rise or fall all the way.
const FRAME_MS = 16
const FADE_MS = 240

// Eases in and out, so the glow starts and settles gently rather than at a constant rate.
const ease = (level: number): number => level * level * (3 - 2 * level)

const colourAt = (level: number): string =>
  `#${REST.map((rest, i) => Math.round(rest + ((LIT[i] ?? rest) - rest) * ease(level)).toString(16).padStart(2, '0')).join('')}`

const Receipt: ClientModule<ReceiptProps, Glow> = (props, surface) => {
  const { Box, Text } = surface.elements

  if (surface.state === undefined) {
    surface.setState({ level: 0, target: 0 })
    surface.every(FRAME_MS, () => {
      const glow = surface.state
      if (glow === undefined || glow.level === glow.target) {
        return
      }
      const step = FRAME_MS / FADE_MS
      const level = glow.target > glow.level ? Math.min(glow.target, glow.level + step) : Math.max(glow.target, glow.level - step)
      surface.setState({ ...glow, level })
    })
    surface.onPointer(event => {
      const glow = surface.state ?? { level: 0, target: 0 }
      if (event.type === 'enter' || (event.type === 'move' && glow.target === 0)) {
        surface.setState({ ...glow, target: 1 })
      } else if (event.type === 'leave') {
        surface.setState({ ...glow, target: 0 })
      } else if (event.type === 'up' && event.button === 'left') {
        surface.post({ type: 'toggle-token-info' })
      }
    })
  }
  const level = surface.state?.level ?? 0

  return (
    <Box columnGap={1}>
      {props.coin === null ? null : <Text color={props.coinColor}>{props.coin}</Text>}
      <Text color={colourAt(level)}>{props.line}</Text>
    </Box>
  )
}

export default Receipt
