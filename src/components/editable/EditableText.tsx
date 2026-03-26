'use client'

import { useState } from 'react'
import { useEditMode } from '@/components/providers/EditModeProvider'

export default function EditableText({
  sectionId,
  path,
  value,
  as = 'p',
  className,
}: {
  sectionId: string
  path: string
  value: string
  as?: keyof JSX.IntrinsicElements
  className?: string
}) {
  const { isEditMode } = useEditMode()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value || '')
  const Tag: any = as

  const save = async () => {
    const res = await fetch(`/api/admin/sections/path/${sectionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, value: text }),
    })
    if (res.ok) setEditing(false)
  }

  if (!isEditMode) return <Tag className={className}>{value}</Tag>

  return (
    <div className="relative group">
      {editing ? (
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700" />
          <button onClick={save} className="px-2 py-1 rounded bg-secondary text-white text-sm">Save</button>
          <button onClick={() => { setText(value || ''); setEditing(false) }} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-sm">Cancel</button>
        </div>
      ) : (
        <Tag className={className}>
          {value}
          <button onClick={() => setEditing(true)} className="ml-2 opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800">Edit</button>
        </Tag>
      )}
    </div>
  )
}
