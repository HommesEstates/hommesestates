'use client'

import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { 
  Bold, Italic, Link as LinkIcon, 
  Heading1, Heading2,
  List, ListOrdered, Check, X
} from 'lucide-react'

interface InlineEditorProps {
  content: string
  onChange: (html: string) => void
  className?: string
  multiline?: boolean
}

export function InlineEditor({ content, onChange, className = '', multiline = true }: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent underline hover:text-accent-dark',
        },
      }),
    ],
    content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // Sync external content changes
  useEffect(() => {
    if (editor && !isEditing && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
  }, [content, editor, isEditing])

  // Handle click outside to exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false)
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing])

  // Enter edit mode
  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      editor?.setEditable(true)
      editor?.chain().focus().run()
    }
  }

  // Exit edit mode
  const handleDone = () => {
    setIsEditing(false)
    editor?.setEditable(false)
  }

  if (!isEditing) {
    return (
      <span 
        ref={containerRef as any}
        onClick={handleClick}
        className={`cursor-text hover:bg-accent/5 rounded px-2 -mx-2 py-1 -my-1 transition-colors group relative inline ${className}`}
        dangerouslySetInnerHTML={{ __html: content || '<span class="text-gray-400">Click to edit...</span>' }}
      />
    )
  }

  return (
    <span ref={containerRef as any} className="relative inline-block w-full">
      {/* Floating toolbar - shown when editor is focused */}
      {editor && isEditing && (
        <div className="flex items-center gap-1 bg-gray-900 text-white p-1.5 rounded-lg shadow-xl mb-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={<Bold className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={<Italic className="w-4 h-4" />}
          />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            icon={<Heading1 className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={<Heading2 className="w-4 h-4" />}
          />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={<List className="w-4 h-4" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={<ListOrdered className="w-4 h-4" />}
          />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolbarButton
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            isActive={editor.isActive('link')}
            icon={<LinkIcon className="w-4 h-4" />}
          />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <button
            onClick={handleDone}
            className="p-1.5 rounded transition-colors hover:bg-green-600 text-green-400 hover:text-white"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent 
        editor={editor} 
        className={`${className} outline-none ring-2 ring-accent/30 rounded px-2 -mx-2 py-1 -my-1 inline-block w-full`}
      />
    </span>
  )
}

function ToolbarButton({ 
  onClick, 
  isActive, 
  icon 
}: { 
  onClick: () => void
  isActive: boolean
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        isActive 
          ? 'bg-accent text-white' 
          : 'hover:bg-gray-800 text-gray-300'
      }`}
    >
      {icon}
    </button>
  )
}
