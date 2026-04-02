'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Trash2, GripVertical, Settings, Mail, 
  User, Phone, FileText, Check, ChevronDown, Type
} from 'lucide-react'
import toast from 'react-hot-toast'

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'number'
  | 'date'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]  // For select fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface FormSectionContent {
  title: string
  description?: string
  submitButton: string
  successMessage: string
  successRedirect?: string
  fields: FormField[]
  webhookUrl?: string
  emailTo?: string
  layout: 'stacked' | '2-col' | '3-col'
}

interface FormBuilderProps {
  content: FormSectionContent
  onChange: (content: FormSectionContent) => void
}

const fieldTypeIcons: Record<FormFieldType, any> = {
  text: Type,
  email: Mail,
  phone: Phone,
  textarea: FileText,
  select: ChevronDown,
  checkbox: Check,
  number: Type,
  date: Type,
}

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: 'Text Input',
  email: 'Email',
  phone: 'Phone',
  textarea: 'Text Area',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  number: 'Number',
  date: 'Date',
}

export function FormBuilder({ content, onChange }: FormBuilderProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [newOption, setNewOption] = useState('')

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const newFields = content.fields.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    )
    onChange({ ...content, fields: newFields })
  }

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: type === 'checkbox' ? 'I agree to the terms' : 'New Field',
      placeholder: type === 'email' ? 'john@example.com' : 'Enter value...',
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    }
    onChange({ ...content, fields: [...content.fields, newField] })
    setEditingFieldId(newField.id)
  }

  const deleteField = (fieldId: string) => {
    onChange({ ...content, fields: content.fields.filter(f => f.id !== fieldId) })
    if (editingFieldId === fieldId) {
      setEditingFieldId(null)
    }
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...content.fields]
      ;[newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]]
      onChange({ ...content, fields: newFields })
    } else if (direction === 'down' && index < content.fields.length - 1) {
      const newFields = [...content.fields]
      ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
      onChange({ ...content, fields: newFields })
    }
  }

  const addOption = (fieldId: string) => {
    if (!newOption.trim()) return
    const field = content.fields.find(f => f.id === fieldId)
    if (field) {
      updateField(fieldId, {
        options: [...(field.options || []), newOption.trim()]
      })
      setNewOption('')
    }
  }

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = content.fields.find(f => f.id === fieldId)
    if (field && field.options) {
      const newOptions = field.options.filter((_, i) => i !== optionIndex)
      updateField(fieldId, { options: newOptions })
    }
  }

  return (
    <div className="space-y-6">
      {/* Form Settings */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Form Settings
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Form Title</label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => onChange({ ...content, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Contact Us"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={content.description || ''}
              onChange={(e) => onChange({ ...content, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="Fill out the form below and we'll get back to you..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Submit Button</label>
              <input
                type="text"
                value={content.submitButton}
                onChange={(e) => onChange({ ...content, submitButton: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="Send Message"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Layout</label>
              <select
                value={content.layout}
                onChange={(e) => onChange({ ...content, layout: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="stacked">Stacked</option>
                <option value="2-col">2 Columns</option>
                <option value="3-col">3 Columns</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Success Message</label>
            <input
              type="text"
              value={content.successMessage}
              onChange={(e) => onChange({ ...content, successMessage: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Thank you! We'll be in touch soon."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Send To Email (optional)</label>
            <input
              type="email"
              value={content.emailTo || ''}
              onChange={(e) => onChange({ ...content, emailTo: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="leads@hommesestates.com"
            />
          </div>
        </div>
      </div>

      {/* Field List */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Form Fields</h4>
        <div className="space-y-2">
          {content.fields.map((field, index) => (
            <motion.div
              key={field.id}
              layout
              className={`p-4 rounded-xl border transition-all ${
                editingFieldId === field.id
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {(() => {
                    const Icon = fieldTypeIcons[field.type]
                    return <Icon className="w-4 h-4 text-gray-600" />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{field.label}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4 rotate-180" />
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === content.fields.length - 1}
                        className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{fieldTypeLabels[field.type]}{field.required && ' • Required'}</p>

                  {/* Field Editor */}
                  {editingFieldId === field.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                      </div>
                      {field.type !== 'checkbox' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                          />
                        </div>
                      )}
                      
                      {/* Options for select fields */}
                      {field.type === 'select' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Options</label>
                          <div className="space-y-2">
                            {field.options?.map((option, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                                  {option}
                                </span>
                                <button
                                  onClick={() => removeOption(field.id, i)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addOption(field.id)}
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                placeholder="New option..."
                              />
                              <button
                                onClick={() => addOption(field.id)}
                                className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Required Field</span>
                        <button
                          onClick={() => updateField(field.id, { required: !field.required })}
                          className={`w-10 h-6 rounded-full transition-colors ${field.required ? 'bg-accent' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${field.required ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Field Buttons */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Add Field</p>
          <div className="flex flex-wrap gap-2">
            {(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'number', 'date'] as FormFieldType[]).map((type) => {
              const Icon = fieldTypeIcons[type]
              return (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {fieldTypeLabels[type]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      {content.fields.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Preview</h4>
          <div className={`grid gap-4 ${
            content.layout === '2-col' ? 'md:grid-cols-2' :
            content.layout === '3-col' ? 'md:grid-cols-3' :
            ''
          }`}>
            {content.fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    disabled
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm h-24 resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select disabled className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    <option>{field.placeholder || 'Select...'}</option>
                    {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" disabled className="rounded border-gray-300" />
                    <span className="text-sm text-gray-600">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    disabled
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          <button disabled className="mt-4 w-full py-2.5 bg-gray-300 text-white rounded-lg font-medium">
            {content.submitButton}
          </button>
        </div>
      )}
    </div>
  )
}
