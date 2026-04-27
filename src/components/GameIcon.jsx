const ICON_PATHS = {
  start: (
    <>
      <path d="M12 5l7 5-7 5-7-5 7-5z" />
      <path d="M8 14v5h8v-5" />
      <path d="M12 10v10" />
    </>
  ),
  problem: (
    <>
      <path d="M12 4l8 14H4L12 4z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  opportunity: (
    <>
      <path d="M12 4c4 0 7 2.8 7 6.5S15.5 20 12 20 5 17 5 10.5 8 4 12 4z" />
      <path d="M12 7.5v7" />
      <path d="M8.8 11h6.4" />
    </>
  ),
  mindset: (
    <>
      <path d="M8 8.5a4 4 0 118 0c0 2.1-1.4 3.1-2.2 4-.4.4-.6.7-.6 1.5h-2.4c0-1.1.3-1.8.8-2.4.9-1 2-1.7 2-3.1a1.6 1.6 0 10-3.2 0" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  fork: (
    <>
      <path d="M12 20V7" />
      <path d="M12 8l-4-4" />
      <path d="M12 8l4-4" />
      <circle cx="8" cy="4" r="2" />
      <circle cx="16" cy="4" r="2" />
      <circle cx="12" cy="20" r="2" />
    </>
  ),
  crisis: (
    <>
      <path d="M13 4l-5 8h3l-1 8 6-9h-3l1-7z" />
    </>
  ),
  district: (
    <>
      <path d="M5 11l7-5 7 5v8H5v-8z" />
      <path d="M9 19v-4h6v4" />
      <path d="M8 11h8" />
    </>
  ),
}

export default function GameIcon({ type = 'district', className = '', filled = false }) {
  const content = ICON_PATHS[type] || ICON_PATHS.district

  return (
    <svg
      className={`game-icon ${filled ? 'is-filled' : ''} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
