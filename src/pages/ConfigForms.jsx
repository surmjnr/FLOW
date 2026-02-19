import React, { useState } from 'react'
import { useConfig } from '../context/ConfigContext'
import ActionsDropdown from '../components/ActionsDropdown'
import './Configuration.css'

const QUESTION_TYPES = [
  { value: 'date', label: 'Date' },
  { value: 'short', label: 'Short input' },
  { value: 'long', label: 'Long input' }
]

const ConfigForms = () => {
  const { forms, loading, createForm, updateForm, removeForm } = useConfig()
  const [formName, setFormName] = useState('')
  const [editingForm, setEditingForm] = useState(null)
  const [questions, setQuestions] = useState([])
  const [saving, setSaving] = useState(false)

  const addQuestion = (type) => {
    const q = {
      id: Date.now().toString(),
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }
    setQuestions(prev => [...prev, q])
  }

  const updateQuestion = (id, updates) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const handleSaveForm = async (e) => {
    e.preventDefault()
    if (editingForm && !formName.trim()) return
    setSaving(true)
    try {
      if (editingForm) {
        await updateForm(editingForm.id, { name: formName.trim() || editingForm.name, questions })
        setEditingForm(null)
      } else {
        await createForm({ name: formName.trim() || 'Untitled Form', questions })
      }
      setFormName('')
      setQuestions([])
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (form) => {
    setEditingForm(form)
    setFormName(form.name)
    setQuestions(form.questions?.length ? form.questions.map(q => ({ ...q, id: q.id || Date.now() + Math.random() })) : [])
  }

  const handleCancelEdit = () => {
    setEditingForm(null)
    setFormName('')
    setQuestions([])
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this form?')) return
    try {
      await removeForm(id)
      if (editingForm?.id === id) handleCancelEdit()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="config-section">
      <div className="form-builder form-section">
        <h3 className="form-builder-title">{editingForm ? 'Edit Form' : 'New Form'}</h3>
        <form onSubmit={handleSaveForm}>
          <div className="form-group">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Form name"
            />
          </div>
          <div className="form-builder-actions-row">
            <div className="form-group form-group-inline">
              <label>Add question type</label>
              <div className="button-group">
                {QUESTION_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className="btn-secondary btn-small"
                    onClick={() => addQuestion(value)}
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-builder-submit">
              {editingForm && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Cancel</button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingForm ? 'Update Form' : 'Create Form'}
              </button>
            </div>
          </div>
          {questions.length > 0 && (
            <div className="questions-list">
              <label>Questions</label>
              {questions.map((q) => (
                <div key={q.id} className="question-row">
                  <span className="question-type-readonly" aria-label="Question type">
                    {QUESTION_TYPES.find(t => t.value === q.type)?.label ?? q.type}
                  </span>
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                    placeholder="Label"
                    className="question-label"
                  />
                  <button type="button" className="btn-delete btn-small" onClick={() => removeQuestion(q.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="forms-list">
        <h3>Saved forms</h3>
        <div className="list-table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>Form name</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">No forms yet.</td>
                </tr>
              ) : (
                forms.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{(f.questions || []).map(q => q.label || q.type).join(', ') || '—'}</td>
                    <td>
                      <ActionsDropdown>
                        <button type="button" className="btn-edit" onClick={() => handleEdit(f)}>Edit</button>
                        <button type="button" className="btn-delete" onClick={() => handleDelete(f.id)}>Delete</button>
                      </ActionsDropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ConfigForms
