import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../context/TransactionContext'
import SearchableDropdown from '../components/SearchableDropdown'
import './NewTransaction.css'

const NewTransaction = () => {
  const { user, isSecretary } = useAuth()
  const { addTransaction } = useTransactions()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    documentTitle: '',
    referenceNumber: '',
    sendingDivision: isSecretary() ? '' : user.division,
    receivingDivision: '',
    transactionType: 'Sent',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    purpose: '',
    status: 'Pending'
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const divisions = ['Finance', 'HR', 'IT', 'Operations', 'Marketing', 'Secretary']

  const divisionOptions = [
    { value: '', label: 'Select division...' },
    ...divisions.map((div) => ({ value: div, label: div }))
  ]
  const receivingDivisionOptions = [
    { value: '', label: 'Select division...' },
    ...divisions.filter((div) => div !== formData.sendingDivision).map((div) => ({ value: div, label: div }))
  ]
  const transactionTypeOptions = [
    { value: 'Sent', label: 'Sent' },
    { value: 'Received', label: 'Received' }
  ]
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.documentTitle.trim()) {
      newErrors.documentTitle = 'Document title is required'
    }

    if (!formData.referenceNumber.trim()) {
      newErrors.referenceNumber = 'Reference number is required'
    }

    if (!formData.sendingDivision) {
      newErrors.sendingDivision = 'Sending division is required'
    }

    if (!formData.receivingDivision) {
      newErrors.receivingDivision = 'Receiving division is required'
    }

    if (formData.sendingDivision === formData.receivingDivision) {
      newErrors.receivingDivision = 'Sending and receiving divisions must be different'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    const dateTime = `${formData.date}T${formData.time}:00`
    const transactionData = {
      ...formData,
      date: dateTime,
      createdBy: user.division
    }

    const result = await addTransaction(transactionData)

    if (result.success) {
      navigate(`/transactions/${result.data.id}`)
    } else {
      alert('Failed to create transaction: ' + (result.error || 'Unknown error'))
      setLoading(false)
    }
  }

  return (
    <div className="new-transaction">
      <div className="page-header">
        <h1>New Document Transaction</h1>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-section">
          <h2>Document Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="documentTitle">
                Document Title / Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="documentTitle"
                name="documentTitle"
                value={formData.documentTitle}
                onChange={handleInputChange}
                placeholder="e.g., Q4 Financial Report"
                required
                className={errors.documentTitle ? 'error' : ''}
              />
              {errors.documentTitle && (
                <span className="error-message">{errors.documentTitle}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="referenceNumber">
                Reference Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="referenceNumber"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                placeholder="e.g., REF-2024-001"
                required
                className={errors.referenceNumber ? 'error' : ''}
              />
              {errors.referenceNumber && (
                <span className="error-message">{errors.referenceNumber}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Transaction Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="sendingDivision">
                Sending Division <span className="required">*</span>
              </label>
              <SearchableDropdown
                id="sendingDivision"
                options={divisionOptions}
                value={formData.sendingDivision}
                onChange={(value) => handleInputChange({ target: { name: 'sendingDivision', value } })}
                placeholder="Search or select division..."
                ariaLabel="Sending division"
                disabled={!isSecretary()}
                className={errors.sendingDivision ? 'error' : ''}
              />
              {errors.sendingDivision && (
                <span className="error-message">{errors.sendingDivision}</span>
              )}
              {!isSecretary() && (
                <small className="form-hint">
                  Your division is automatically set as the sender
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="receivingDivision">
                Receiving Division <span className="required">*</span>
              </label>
              <SearchableDropdown
                id="receivingDivision"
                options={receivingDivisionOptions}
                value={formData.receivingDivision}
                onChange={(value) => handleInputChange({ target: { name: 'receivingDivision', value } })}
                placeholder="Search or select division..."
                ariaLabel="Receiving division"
                className={errors.receivingDivision ? 'error' : ''}
              />
              {errors.receivingDivision && (
                <span className="error-message">{errors.receivingDivision}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="transactionType">
                Transaction Type <span className="required">*</span>
              </label>
              <SearchableDropdown
                id="transactionType"
                options={transactionTypeOptions}
                value={formData.transactionType}
                onChange={(value) => handleInputChange({ target: { name: 'transactionType', value } })}
                placeholder="Search or select type..."
                ariaLabel="Transaction type"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">
                Status <span className="required">*</span>
              </label>
              <SearchableDropdown
                id="status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleInputChange({ target: { name: 'status', value } })}
                placeholder="Search or select status..."
                ariaLabel="Status"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className={errors.date ? 'error' : ''}
              />
              {errors.date && (
                <span className="error-message">{errors.date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>
          <div className="form-group full-width">
            <label htmlFor="purpose">Purpose / Description</label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              rows="5"
              placeholder="Describe the purpose of this document transaction..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewTransaction
