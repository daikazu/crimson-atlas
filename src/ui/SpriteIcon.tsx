import { SPRITE_BASE } from '../data/useMapData'
import { useData } from './DataContext'

/** Renders one marker icon from the MapLibre sprite sheet at the given height in CSS px. */
export function SpriteIcon({ icon, height = 28 }: { icon: string; height?: number }) {
  const { sprite, spriteSize } = useData()
  const entry = sprite[icon]
  if (!entry) return <span className="sprite-icon" style={{ width: height * 0.75, height }} />

  const scale = height / entry.height
  return (
    <span
      className="sprite-icon"
      aria-hidden
      style={{
        width: entry.width * scale,
        height,
        backgroundImage: `url(${SPRITE_BASE}@2x.png)`,
        backgroundSize: `${spriteSize.w * scale}px ${spriteSize.h * scale}px`,
        backgroundPosition: `-${entry.x * scale}px -${entry.y * scale}px`,
      }}
    />
  )
}
