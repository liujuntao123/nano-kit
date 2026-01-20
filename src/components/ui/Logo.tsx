export function LogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="12" r="6" fill="currentColor" opacity="0.92" />
      <circle
        cx="15"
        cy="12"
        r="6"
        stroke="var(--accent-color)"
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

