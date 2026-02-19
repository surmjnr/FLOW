import React, { useState } from 'react'
import { useConfig } from '../context/ConfigContext'
import ActionsDropdown from '../components/ActionsDropdown'
import './Configuration.css'

const ConfigRecipient = () => {
  const { recipients, loading, createRecipient, removeRecipient } = useConfig()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await createRecipient(name.trim())
      setName('')
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this division?')) return
    try {
      await removeRecipient(id)
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="config-section">
      <h2>Divisions</h2>
      <form onSubmit={handleSubmit} className="inline-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Division name"
          className="inline-input"
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-cell">No divisions yet.</td>
              </tr>
            ) : (
              recipients.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <ActionsDropdown>
                      <button type="button" className="btn-delete" onClick={() => handleDelete(r.id)}>
                        Delete
                      </button>
                    </ActionsDropdown>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ConfigRecipient
