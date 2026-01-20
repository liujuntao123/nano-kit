import { useAppStore } from '../../store/appStore'
import { usePageHeader } from './PageHeaderContext'

export default function DesktopHeader() {
  const { theme, toggleTheme } = useAppStore()
  const { header } = usePageHeader()
  const isDark = theme === 'dark'

  return (
    <header className="hidden lg:flex items-start justify-between px-4 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="min-w-0 flex-1">
        {header?.title && (
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">{header.title}</h1>
            {header.description && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1 font-serif">
                {header.description}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {header?.actions && (
          <div className="flex items-center gap-2">
            {header.actions}
          </div>
        )}
        {header?.actions && <div className="h-6 w-px bg-[var(--border-color)]" aria-hidden="true" />}
        <a
          href="https://t1728t6ifnr.feishu.cn/wiki/AhHAwekHFiv05SkzmSlcWnnKnob?from=from_copylink"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          title="使用教程"
        >
          <BookIcon />
        </a>
        <a
          href="https://github.com/liujuntao123/nano-kit"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          title="GitHub"
        >
          <GitHubIcon />
        </a>
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          title={isDark ? '切换到明亮模式' : '切换到暗黑模式'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}
