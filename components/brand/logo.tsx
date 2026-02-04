interface LogoProps {
  size?: number
  className?: string
}

/**
 * Evexia Logo Mark - 4-square geometric pattern with center dot
 * Uses Deep Forest theme gradient
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby="logo-title"
    >
      <title id="logo-title">Evexia logo</title>
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 35% 20%)" />
          <stop offset="100%" stopColor="hsl(180 40% 35%)" />
        </linearGradient>
      </defs>
      {/* Top-left square */}
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        fill="url(#logo-gradient)"
      />
      {/* Top-right square */}
      <rect
        x="18"
        y="2"
        width="12"
        height="12"
        rx="2"
        fill="url(#logo-gradient)"
        opacity="0.7"
      />
      {/* Bottom-left square */}
      <rect
        x="2"
        y="18"
        width="12"
        height="12"
        rx="2"
        fill="url(#logo-gradient)"
        opacity="0.7"
      />
      {/* Bottom-right square */}
      <rect
        x="18"
        y="18"
        width="12"
        height="12"
        rx="2"
        fill="url(#logo-gradient)"
      />
      {/* Center dot */}
      <circle cx="16" cy="16" r="3" fill="url(#logo-gradient)" />
    </svg>
  )
}

/**
 * Evexia Logo with Text - Full branding with mark + "evexia" wordmark
 * Uses Deep Forest theme gradient
 */
export function LogoWithText({ size = 40, className = '' }: LogoProps) {
  const textSize = size * 0.6
  const totalWidth = size + textSize * 3.5

  return (
    <svg
      width={totalWidth}
      height={size}
      viewBox={`0 0 ${totalWidth} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby="logo-text-title"
    >
      <title id="logo-text-title">Evexia</title>
      <defs>
        <linearGradient
          id="logo-text-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="hsl(160 35% 20%)" />
          <stop offset="100%" stopColor="hsl(180 40% 35%)" />
        </linearGradient>
      </defs>
      {/* Logo mark scaled to size */}
      <g transform={`scale(${size / 32})`}>
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="2"
          fill="url(#logo-text-gradient)"
        />
        <rect
          x="18"
          y="2"
          width="12"
          height="12"
          rx="2"
          fill="url(#logo-text-gradient)"
          opacity="0.7"
        />
        <rect
          x="2"
          y="18"
          width="12"
          height="12"
          rx="2"
          fill="url(#logo-text-gradient)"
          opacity="0.7"
        />
        <rect
          x="18"
          y="18"
          width="12"
          height="12"
          rx="2"
          fill="url(#logo-text-gradient)"
        />
        <circle cx="16" cy="16" r="3" fill="url(#logo-text-gradient)" />
      </g>
      {/* Text */}
      <text
        x={size + 8}
        y={size * 0.68}
        fontSize={textSize}
        fontWeight="600"
        fontFamily="var(--font-serif), Georgia, serif"
        fill="currentColor"
      >
        evexia
      </text>
    </svg>
  )
}

/**
 * Evexia Text Logo - Compact wordmark with gradient dot
 * Uses Deep Forest theme gradient
 */
export function LogoText({ size = 24, className = '' }: LogoProps) {
  const totalWidth = size * 3.5

  return (
    <svg
      width={totalWidth}
      height={size}
      viewBox={`0 0 ${totalWidth} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby="text-logo-title"
    >
      <title id="text-logo-title">Evexia</title>
      <defs>
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 35% 20%)" />
          <stop offset="100%" stopColor="hsl(180 40% 35%)" />
        </linearGradient>
      </defs>
      {/* Text */}
      <text
        x="0"
        y={size * 0.75}
        fontSize={size * 0.9}
        fontWeight="600"
        fontFamily="var(--font-serif), Georgia, serif"
        fill="currentColor"
      >
        evexia
      </text>
      {/* Gradient dot after text */}
      <circle
        cx={totalWidth - size * 0.15}
        cy={size * 0.65}
        r={size * 0.12}
        fill="url(#text-gradient)"
      />
    </svg>
  )
}
