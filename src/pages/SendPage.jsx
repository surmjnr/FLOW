import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { createTransfer, getUsersByDivision, getDefaultUserRecipientId } from '../services/mockApi'
import SearchableDropdown from '../components/SearchableDropdown'
import './SendPage.css'

const todayStr = () => new Date().toISOString().split('T')[0]

const SendPage = () => {
  const { user, canRecord, isAdmin } = useAuth()
  if (isAdmin()) return <Navigate to="/records" replace />
  if (!canRecord()) {
    return <Navigate to="/receive" replace />
  }
  const { recipients, fetchAll, getFormForRecipient } = useConfig()
  const [recipientType, setRecipientType] = useState('division') // 'division' | 'internal'
  const [selectedRecipientId, setSelectedRecipientId] = useState('')
  const [selectedInternalId, setSelectedInternalId] = useState('')
  const [internalUsers, setInternalUsers] = useState([]) // users in the same division as current user
  const [formData, setFormData] = useState({})
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!user?.division) {
      setInternalUsers([])
      return
    }
    getUsersByDivision(user.division).then(setInternalUsers).catch(() => setInternalUsers([]))
  }, [user?.division])

  const userRecipientId = getDefaultUserRecipientId()
  const divisionRecipients = recipients.filter(r => r.id !== userRecipientId && r.name !== user?.division)
  const formForUserRecipient = getFormForRecipient(userRecipientId)
  const formForDivision = selectedRecipientId ? getFormForRecipient(selectedRecipientId) : null
  const linkedForm = selectedInternalId ? formForUserRecipient : formForDivision
  const recipient = divisionRecipients.find(r => r.id === selectedRecipientId)
  const selectedInternal = internalUsers.find(u => u.id === selectedInternalId)

  const divisionOptions = [
    { value: '', label: 'Select division...' },
    ...divisionRecipients.map((r) => ({ value: r.id, label: r.name }))
  ]
  const internalOptions = [
    { value: '', label: 'Select person...' },
    ...internalUsers.map((u) => ({ value: u.id, label: u.name || u.username || '—' }))
  ]

  useEffect(() => {
    if (linkedForm && linkedForm.questions) {
      const initial = {}
      linkedForm.questions.forEach((q, idx) => {
        const key = q.id || idx
        if (q.type === 'date') {
          initial[key] = formData[key] || todayStr()
        } else {
          initial[key] = formData[key] ?? ''
        }
      })
      setFormData(initial)
    } else {
      setFormData({})
    }
  }, [linkedForm?.id])

  const handleRecipientTypeChange = (type) => {
    setRecipientType(type)
    if (type === 'division') {
      setSelectedInternalId('')
      setFormData(prev => (selectedRecipientId ? prev : {}))
    } else {
      setSelectedRecipientId('')
      setFormData(prev => (selectedInternalId ? prev : {}))
    }
  }

  const handleDivisionSelect = (value) => {
    setRecipientType('division')
    setSelectedRecipientId(value)
    setSelectedInternalId('')
    setFormData({})
  }

  const handleInternalSelect = (value) => {
    setRecipientType('internal')
    setSelectedInternalId(value)
    setSelectedRecipientId('')
    setFormData({})
  }

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!linkedForm) {
      alert(selectedInternalId ? 'Link a form to "User" in Configuration → Link, or clear Internal.' : 'Select a recipient with a linked form.')
      return
    }
    const sendingToInternal = !!selectedInternalId
    const transferRecipientId = sendingToInternal ? selectedInternalId : selectedRecipientId
    const transferRecipientName = sendingToInternal ? (selectedInternal?.name || selectedInternal?.username) : recipient?.name
    if (!transferRecipientId) {
      alert(sendingToInternal ? 'Select an internal person.' : 'Select a division.')
      return
    }
    // Validate form fields
    const missingFields = linkedForm.questions.filter(q => {
      const key = q.id || linkedForm.questions.indexOf(q)
      const value = formData[key]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    if (missingFields.length > 0) {
      alert('Please fill all required fields.')
      return
    }
    setSending(true)
    try {
      await createTransfer({
        recipientId: transferRecipientId,
        recipientName: transferRecipientName,
        formId: linkedForm.id,
        sentBy: user?.division || user?.id,
        sentByName: user?.name || user?.username,
        formData
      })
      setFormData({})
      setSelectedRecipientId('')
      setSelectedInternalId('')
      window.dispatchEvent(new CustomEvent('receive-count-changed'))
      window.dispatchEvent(new CustomEvent('transfers-changed'))
      alert('Transfer sent successfully.')
    } catch (err) {
      alert('Failed to send: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const showNoFormForDivision = selectedRecipientId && !selectedInternalId && !formForDivision
  const showNoFormForUser = selectedInternalId && !formForUserRecipient
  if (!linkedForm && (showNoFormForDivision || showNoFormForUser)) {
    const rec = showNoFormForDivision ? divisionRecipients.find(r => r.id === selectedRecipientId) : null
    const message = showNoFormForUser
      ? 'No form is linked to <strong>User</strong>. Link a form in Configuration → Link.'
      : `No form is linked to <strong>${rec?.name ?? 'this division'}</strong>. Link a form in Configuration → Link.`
    return (
      <div className="send-page">
        <section className="send-card send-card--recipient">
          <div className="send-recipient-selection">
            <div className="send-view-by-row">
              <div className="send-view-by-label">Send to</div>
              <div className="send-view-by-radios">
                <label className="send-view-by-radio">
                  <input
                    type="radio"
                    name="recipientType"
                    value="division"
                    checked={recipientType === 'division'}
                    onChange={() => handleRecipientTypeChange('division')}
                  />
                  <span className="send-view-by-radio-label">Division</span>
                </label>
                <label className="send-view-by-radio">
                  <input
                    type="radio"
                    name="recipientType"
                    value="internal"
                    checked={recipientType === 'internal'}
                    onChange={() => handleRecipientTypeChange('internal')}
                  />
                  <span className="send-view-by-radio-label">Internal</span>
                </label>
              </div>
            {recipientType === 'division' && (
              <div className="send-recipient-dropdown-wrap">
                <SearchableDropdown
                  className="send-recipient-searchable"
                  options={divisionOptions}
                  value={selectedRecipientId}
                  onChange={handleDivisionSelect}
                  placeholder="Search or select division..."
                  ariaLabel="Choose division"
                />
              </div>
            )}
            {recipientType === 'internal' && (
              <div className="send-recipient-dropdown-wrap">
                <SearchableDropdown
                  className="send-recipient-searchable"
                  options={internalOptions}
                  value={selectedInternalId}
                  onChange={handleInternalSelect}
                  placeholder="Search or select person..."
                  ariaLabel="Choose person"
                />
              </div>
            )}
            </div>
            <div className="send-empty-state">
              <p className="send-empty-state__text">{showNoFormForUser ? 'No form is linked to User.' : `No form is linked to ${rec?.name ?? 'this division'}.`}</p>
              <p className="send-empty-state__hint">Link a form in Configuration → Link.</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="send-page">
      <section className="send-card send-card--recipient">
        <div className="send-recipient-selection">
          <div className="send-view-by-row">
            <div className="send-view-by-label">Send to</div>
            <div className="send-view-by-radios">
              <label className="send-view-by-radio">
                <input
                  type="radio"
                  name="recipientType"
                  value="division"
                  checked={recipientType === 'division'}
                  onChange={() => handleRecipientTypeChange('division')}
                />
                <span className="send-view-by-radio-label">Division</span>
              </label>
              <label className="send-view-by-radio">
                <input
                  type="radio"
                  name="recipientType"
                  value="internal"
                  checked={recipientType === 'internal'}
                  onChange={() => handleRecipientTypeChange('internal')}
                />
                <span className="send-view-by-radio-label">Internal</span>
              </label>
            </div>
            {recipientType === 'division' && (
              <div className="send-recipient-dropdown-wrap">
                <SearchableDropdown
                  className="send-recipient-searchable"
                  options={divisionOptions}
                  value={selectedRecipientId}
                  onChange={handleDivisionSelect}
                  placeholder="Search or select division..."
                  ariaLabel="Choose division"
                />
              </div>
            )}
            {recipientType === 'internal' && (
              <div className="send-recipient-dropdown-wrap">
                <SearchableDropdown
                  className="send-recipient-searchable"
                  options={internalOptions}
                  value={selectedInternalId}
                  onChange={handleInternalSelect}
                  placeholder="Search or select person..."
                  ariaLabel="Choose person"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {linkedForm && (
        <section className="send-card send-card--form">
          <h2 className="send-card__heading">{linkedForm.name}</h2>
          <form onSubmit={handleSubmit} className="send-form">
            <div className="send-form__fields">
              {(linkedForm.questions || []).map((q, idx) => {
                const key = q.id || idx
                const value = formData[key] ?? (q.type === 'date' ? todayStr() : '')
                const label = q.label || q.type
                const isShort = q.type === 'short' || q.type === 'date'

                if (q.type === 'date') {
                  return (
                    <div key={key} className={`form-group form-group--${q.type} ${isShort ? 'form-group--short' : ''}`}>
                      <label className="form-label" htmlFor={`field-${key}`}>{label}</label>
                      <input
                        id={`field-${key}`}
                        type="date"
                        className="form-input form-input--date"
                        value={value}
                        onChange={e => handleFieldChange(key, e.target.value)}
                      />
                    </div>
                  )
                }
                if (q.type === 'long') {
                  return (
                    <div key={key} className={`form-group form-group--${q.type}`}>
                      <label className="form-label" htmlFor={`field-${key}`}>{label}</label>
                      <textarea
                        id={`field-${key}`}
                        className="form-input form-input--textarea"
                        value={value}
                        onChange={e => handleFieldChange(key, e.target.value)}
                        rows={4}
                        placeholder="Enter details..."
                      />
                    </div>
                  )
                }
                return (
                  <div key={key} className={`form-group form-group--short`}>
                    <label className="form-label" htmlFor={`field-${key}`}>{label}</label>
                    <input
                      id={`field-${key}`}
                      type="text"
                      className="form-input"
                      value={value}
                      onChange={e => handleFieldChange(key, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                    />
                  </div>
                )
              })}
            </div>
            <div className="send-form__actions">
              <button type="submit" className="send-btn" disabled={sending}>
                {sending ? (
                  <span className="send-btn__loading">Sending...</span>
                ) : (
                  <>Send</>
                )}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

export default SendPage
