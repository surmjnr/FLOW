import React, { useState, useEffect } from 'react'
import { useConfig } from '../context/ConfigContext'
import ActionsDropdown from '../components/ActionsDropdown'
import SearchableDropdown from '../components/SearchableDropdown'
import './Configuration.css'

const ConfigLink = () => {
  const { recipients, forms, links, loading, fetchAll, linkFormToRecipient, unlink } = useConfig()
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleLink = async (e) => {
    e.preventDefault()
    if (!selectedRecipient || !selectedForm) {
      alert('Select both recipient and form.')
      return
    }
    setSaving(true)
    try {
      await linkFormToRecipient(selectedRecipient, selectedForm)
      setSelectedRecipient('')
      setSelectedForm('')
    } catch (err) {
      alert('Failed to link: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Remove this link?')) return
    try {
      await unlink(linkId)
    } catch (err) {
      alert('Failed to remove link: ' + err.message)
    }
  }

  const getRecipientName = (id) => recipients.find(r => r.id === id)?.name || id
  const getFormName = (id) => forms.find(f => f.id === id)?.name || id

  const recipientOptions = [
    { value: '', label: 'Select recipient...' },
    ...recipients.map((r) => ({ value: r.id, label: r.name }))
  ]
  const formOptions = [
    { value: '', label: 'Select form...' },
    ...forms.map((f) => ({ value: f.id, label: f.name }))
  ]

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="config-section">
      <form onSubmit={handleLink} className="link-form form-section">
        <div className="link-form-row">
          <div className="form-group">
            <label>Recipient</label>
            <SearchableDropdown
              options={recipientOptions}
              value={selectedRecipient}
              onChange={setSelectedRecipient}
              placeholder="Search or select recipient..."
              ariaLabel="Choose recipient"
            />
          </div>
          <div className="form-group">
            <label>Form</label>
            <SearchableDropdown
              options={formOptions}
              value={selectedForm}
              onChange={setSelectedForm}
              placeholder="Search or select form..."
              ariaLabel="Choose form"
            />
          </div>
          <div className="link-form-submit">
            <label className="link-form-submit-spacer" aria-hidden="true">Link</label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Linking...' : 'Link'}
            </button>
          </div>
        </div>
      </form>

      <div className="links-list">
        <h3>Current links</h3>
        <div className="list-table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Form</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">No links yet.</td>
                </tr>
              ) : (
                links.map((l) => (
                  <tr key={l.id}>
                    <td>{getRecipientName(l.recipientId)}</td>
                    <td>{getFormName(l.formId)}</td>
                    <td>
                      <ActionsDropdown>
                        <button type="button" className="btn-delete" onClick={() => handleUnlink(l.id)}>
                          Unlink
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
    </div>
  )
}

export default ConfigLink
