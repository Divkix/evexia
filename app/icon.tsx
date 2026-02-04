import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Evexia"
      >
        <title>Evexia</title>
        <defs>
          <linearGradient
            id="icon-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#213d36" />
            <stop offset="100%" stopColor="#366868" />
          </linearGradient>
        </defs>
        {/* Top-left square */}
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="2"
          fill="url(#icon-gradient)"
        />
        {/* Top-right square */}
        <rect
          x="18"
          y="2"
          width="12"
          height="12"
          rx="2"
          fill="url(#icon-gradient)"
          opacity="0.7"
        />
        {/* Bottom-left square */}
        <rect
          x="2"
          y="18"
          width="12"
          height="12"
          rx="2"
          fill="url(#icon-gradient)"
          opacity="0.7"
        />
        {/* Bottom-right square */}
        <rect
          x="18"
          y="18"
          width="12"
          height="12"
          rx="2"
          fill="url(#icon-gradient)"
        />
        {/* Center dot */}
        <circle cx="16" cy="16" r="3" fill="url(#icon-gradient)" />
      </svg>
    </div>,
    {
      ...size,
    },
  )
}
