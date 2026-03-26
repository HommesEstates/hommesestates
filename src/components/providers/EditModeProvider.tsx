'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Ctx = { isEditMode: boolean }
const EditCtx = createContext<Ctx>({ isEditMode: false })

export function useEditMode() {
  return useContext(EditCtx)
}

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false)
  useEffect(() => {
    const read = () => {
      const v = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('he_edit_mode='))
      setIsEditMode(v ? v.split('=')[1] === '1' : false)
    }
    read()
    const handler = () => read()
    window.addEventListener('he-edit-mode-changed', handler as any)
    return () => window.removeEventListener('he-edit-mode-changed', handler as any)
  }, [])
  const value = useMemo(() => ({ isEditMode }), [isEditMode])
  return <EditCtx.Provider value={value}>{children}</EditCtx.Provider>
}
