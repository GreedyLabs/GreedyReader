// Hand-drawn SVG icon set for GreedyReader
// Stroke-based, slightly irregular — warm and handcrafted feel

interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

interface StarIconProps extends IconProps {
  filled?: boolean
}

const HD = ({
  children,
  size = 22,
  className,
  style,
}: {
  children: React.ReactNode
  size?: number
  className?: string
  style?: React.CSSProperties
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {children}
  </svg>
)

export function IconLibrary({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M5 3.2c-.3 0-.5.2-.5.5v17c0 .3.2.5.5.4L9 21V3l-4 .2z" />
      <path d="M10 3l4 .2v17.6l-4 .2z" />
      <path d="M16 4.5l3 .6c.3 0 .4.3.4.5L16.8 22c0 .3-.3.4-.5.4l-2.2-.5" />
    </HD>
  )
}

export function IconStats({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M3.5 21.2c0 0 17 0 17 0" />
      <path d="M6 20V12M11 20V8M16 20v-5" />
    </HD>
  )
}

export function IconAI({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M5 6.5c0-.8.7-1.5 1.5-1.5h11c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5h-11c-.8 0-1.5-.7-1.5-1.5z" />
      <path d="M12 2.5v3" />
      <path d="M9 12c0-.2 0-.3 0-.3M15 12c0 0 0-.2 0-.3" />
      <path d="M9 15.5c0 0 2 1.5 6 0" />
    </HD>
  )
}

export function IconPlus({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M12 5.5c0 0 0 13 0 13" />
      <path d="M5.5 12c0 0 13 0 13 0" />
    </HD>
  )
}

export function IconSearch({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M10.5 4.5c3.5 0 6.5 2.8 6.5 6.4 0 3.5-3 6.6-6.5 6.6-3.6 0-6.5-3-6.5-6.6 0-3.6 3-6.4 6.5-6.4z" />
      <path d="M20 20.5c0 0-4-4.2-4.2-4.2" />
    </HD>
  )
}

export function IconBookmark({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M6 3c0 0 12 0 12 0 .3 0 .5.3.5.5V21c0 .3-.3.5-.6.3L12 18l-6 3c-.3 0-.5 0-.5-.3V3.5c0-.2.2-.5.5-.5z" />
    </HD>
  )
}

export function IconOpenBook({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M3 4.5c0 0 4 0 5 0 2 .3 3.5 1.7 3.8 4v13c0 0-6.5-2-8.8-2z" />
      <path d="M21 4.5c0 0-4 0-5 0-2 .3-3.5 1.7-3.8 4v13c0 0 6.5-2 8.8-2z" />
    </HD>
  )
}

export function IconCheck({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M4.5 12.5c0 0 4 4.8 4.5 5 .4.2 11.8-11 11.8-11" />
    </HD>
  )
}

export function IconStar({ size = 22, filled = false, className, style }: StarIconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path
        d="M12 2.5c0 0 2.8 6 3 6.2.3.2 6.8.8 6.8.8s-4.6 4.6-4.8 5c-.3.2 1 6.8 1 6.8s-5.7-3.2-6-3.2c-.3 0-6 3.2-6 3.2s1.3-6.6 1-6.8c-.2-.4-4.8-5-4.8-5s6.5-.6 6.8-.8c.2-.3 3-6.2 3-6.2z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </HD>
  )
}

export function IconNote({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M5 3c0 0 8.8 0 9.3 0l5 5v13c0 .3-.3.5-.5.5H5c-.3 0-.5-.2-.5-.5V3.5c0-.3.2-.5.5-.5z" />
      <path d="M14 3v5.2h5M8 13c0 0 8.2 0 8 0M8 16.8c0 0 5.2 0 5 0" />
    </HD>
  )
}

export function IconMic({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M9 5c0-1.7 1.3-3 3-3 1.6 0 3 1.3 3 3v7c0 1.6-1.4 3-3 3-1.7 0-3-1.4-3-3z" />
      <path d="M19 11c0 3.8-3.2 7-7 7-3.9 0-7-3.2-7-7M12 18v4M8 22h8" />
    </HD>
  )
}

export function IconMore({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </HD>
  )
}

export function IconClose({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M6 6c0 0 12 12.5 12 12.5" />
      <path d="M18 6c0 0-12 12.5-12 12.5" />
    </HD>
  )
}

export function IconBack({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M20 12c0 0-15.5 0-15.5 0" />
      <path d="M11 19c0 0-7-7-7-7 0 0 7-7 7-7" />
    </HD>
  )
}

export function IconBarcode({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M4 6.5c0 0 0 11 0 11" strokeWidth={1.8} />
      <path d="M7 6.5c0 0 0 11 0 11" strokeWidth={3} />
      <path d="M10 6.5c0 0 0 11 0 11" strokeWidth={1.8} />
      <path d="M13 6.5c0 0 0 11 0 11" strokeWidth={1.2} />
      <path d="M15.5 6.5c0 0 0 11 0 11" strokeWidth={3} />
      <path d="M18.5 6.5c0 0 0 11 0 11" strokeWidth={1.8} />
      <path d="M3 4.5h4M17 4.5h4M3 19.5h4M17 19.5h4" strokeWidth={1.8} />
    </HD>
  )
}

export function IconSend({ size = 22, className, style }: IconProps) {
  return (
    <HD size={size} className={className} style={style}>
      <path d="M21 3c0 0-18.5 8-18.5 8s7.5 1.5 8 2c.5.5 2 8 2 8s10-18 8.5-18z" />
    </HD>
  )
}
