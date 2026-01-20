import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type PageHeaderConfig = {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

type PageHeaderContextValue = {
  header: PageHeaderConfig | null
  setHeader: (header: PageHeaderConfig | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderConfig | null>(null)
  const value = useMemo(() => ({ header, setHeader }), [header])

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (!context) {
    throw new Error('usePageHeader must be used within PageHeaderProvider')
  }
  return context
}
