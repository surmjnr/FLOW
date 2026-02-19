import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../context/TransactionContext'
import { format } from 'date-fns'
import SearchableDropdown from '../components/SearchableDropdown'
import './TransactionDetails.css'

const TransactionDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, canEditAll, canDelete, canAccessTransaction } = useAuth()
  const { transactions, editTransaction, removeTransaction } = useTransactions()
  const [transaction, setTransaction] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = transactions.find(t => t.id === id)
    if (found) {
      if (!canAccessTransaction(found)) {
        navigate('/transactions')
        return
      }
      setTransaction(found)
      setFormData({
        documentTitle: found.documentTitle,
        referenceNumber: found.referenceNumber,
        sendingDivision: found.sendingDivision,
        receivingDivision: found.receivingDivision,
        transactionType: found.transactionType,
        date: found.date.split('T')[0],
        time: found.date.split('T')[1]?.substring(0, 5) || '',
        purpose: found.purpose,
        status: found.status
      })
    }
    setLoading(false)
  }, [id, transactions, canAccessTransaction, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const dateTime = `${formData.date}T${formData.time}:00`
    
    const result = await editTransaction(id, {
      ...formData,
      date: dateTime
    })

    if (result.success) {
      setIsEditing(false)
      setTransaction(result.data)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const result = await removeTransaction(id)
      if (result.success) {
        navigate('/transactions')
      }
    }
  }

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

  if (loading) {
    return <div className="loading">Loading transaction details...</div>
  }

  if (!transaction) {
    return (
      <div className="error-state">
        <p>Transaction not found.</p>
        <Link to="/transactions" className="btn-primary">
          Back to Transactions
        </Link>
      </div>
    )
  }

  return (
    <div className="transaction-details">
      <div className="details-header">
        <div>
          <Link to="/transactions" className="back-link">
            ← Back to Transactions
          </Link>
          <h1>{transaction.documentTitle}</h1>
          <p className="reference">Reference: {transaction.referenceNumber}</p>
        </div>
        {canEditAll() && (
          <div className="header-actions">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-edit"
                >
                  Edit
                </button>
                {canDelete() && (
                  <button onClick={handleDelete} className="btn-delete">
                    Delete
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Document Title *</label>
              <input
                type="text"
                name="documentTitle"
                value={formData.documentTitle}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Reference Number *</label>
              <input
                type="text"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Sending Division *</label>
              <SearchableDropdown
                options={divisionOptions}
                value={formData.sendingDivision}
                onChange={(value) => handleInputChange({ target: { name: 'sendingDivision', value } })}
                placeholder="Search or select division..."
                ariaLabel="Sending division"
              />
            </div>

            <div className="form-group">
              <label>Receiving Division *</label>
              <SearchableDropdown
                options={receivingDivisionOptions}
                value={formData.receivingDivision}
                onChange={(value) => handleInputChange({ target: { name: 'receivingDivision', value } })}
                placeholder="Search or select division..."
                ariaLabel="Receiving division"
              />
            </div>

            <div className="form-group">
              <label>Transaction Type *</label>
              <SearchableDropdown
                options={transactionTypeOptions}
                value={formData.transactionType}
                onChange={(value) => handleInputChange({ target: { name: 'transactionType', value } })}
                placeholder="Search or select type..."
                ariaLabel="Transaction type"
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <SearchableDropdown
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleInputChange({ target: { name: 'status', value } })}
                placeholder="Search or select status..."
                ariaLabel="Status"
              />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Purpose / Description</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="details-content">
          <div className="details-grid">
            <div className="detail-item">
              <label>Sending Division</label>
              <p>{transaction.sendingDivision}</p>
            </div>

            <div className="detail-item">
              <label>Receiving Division</label>
              <p>{transaction.receivingDivision}</p>
            </div>

            <div className="detail-item">
              <label>Transaction Type</label>
              <p>
                <span
                  className={`badge ${
                    transaction.transactionType === 'Sent'
                      ? 'badge-sent'
                      : 'badge-received'
                  }`}
                >
                  {transaction.transactionType}
                </span>
              </p>
            </div>

            <div className="detail-item">
              <label>Status</label>
              <p>
                <span
                  className={`badge ${
                    transaction.status === 'Completed'
                      ? 'badge-completed'
                      : 'badge-pending'
                  }`}
                >
                  {transaction.status}
                </span>
              </p>
            </div>

            <div className="detail-item">
              <label>Date & Time</label>
              <p>{format(new Date(transaction.date), 'MMMM dd, yyyy')}</p>
            </div>

            <div className="detail-item">
              <label>Created By</label>
              <p>{transaction.createdBy || 'N/A'}</p>
            </div>
          </div>

          <div className="detail-section">
            <label>Purpose / Description</label>
            <p className="purpose-text">{transaction.purpose || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionDetails
