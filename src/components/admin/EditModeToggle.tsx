'use client'

import { useEffect, useState } from 'react'

export default function EditModeToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const v = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('he_edit_mode='))
    setOn(v ? v.split('=')[1] === '1' : false)
  }, [])
  const toggle = () => {
    const v = on ? '0' : '1'
    document.cookie = `he_edit_mode=${v}; path=/; max-age=604800`
    setOn(!on)
    window.dispatchEvent(new Event('he-edit-mode-changed'))
  }
  const enablePreview = () => {
    const path = window.location.pathname + window.location.search + window.location.hash
    window.location.href = `/api/admin/preview/enable?path=${encodeURIComponent(path || '/')}`
  }
  const disablePreview = () => {
    const path = window.location.pathname + window.location.search + window.location.hash
    window.location.href = `/api/admin/preview/disable?path=${encodeURIComponent(path || '/')}`
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={toggle} className={`px-3 py-2 rounded-lg ${on ? 'bg-secondary text-white' : 'bg-neutral-200 dark:bg-neutral-800'}`}>{on ? 'Edit Mode: On' : 'Edit Mode: Off'}</button>
      <button onClick={enablePreview} className="px-3 py-2 rounded-lg bg-accent text-white">Enable Preview</button>
      <button onClick={disablePreview} className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800">Disable Preview</button>
    </div>
  )
}
