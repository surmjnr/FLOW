import React, { useState, useEffect } from 'react'
import './DocumentForm.css'

const DocumentForm = ({ 
  initialData = null, 
  onSubmit, 
  category,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    dateReceived: '',
    registryNumber: '',
    receivedFrom: '',
    dateOfLetter: '',
    numberOfLetters: 1,
    subject: '',
    signature: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        dateReceived: initialData.dateReceived || '',
        registryNumber: initialData.registryNumber || '',
        receivedFrom: initialData.receivedFrom || '',
        dateOfLetter: initialData.dateOfLetter || '',
        numberOfLetters: initialData.numberOfLetters || 1,
        subject: initialData.subject || '',
        signature: initialData.signature || '',
        status: initialData.status || 'pending'
      })
    }
  }, [initialData])

  // Check if this category should show status field
  const categoriesWithStatus = ['DDG-T0', 'DG', 'ALL UNITS', 'All Divisions']
  const showStatusField = categoriesWithStatus.includes(category)

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

    if (!formData.dateReceived) {
      newErrors.dateReceived = 'Date received is required'
    }

    if (!formData.registryNumber.trim()) {
      newErrors.registryNumber = 'Registry number is required'
    }

    if (!formData.receivedFrom.trim()) {
      newErrors.receivedFrom = 'Received from is required'
    }

    if (!formData.dateOfLetter) {
      newErrors.dateOfLetter = 'Date of letter is required'
    }

    if (!formData.numberOfLetters || formData.numberOfLetters < 1) {
      newErrors.numberOfLetters = 'Number of letters must be at least 1'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.signature.trim()) {
      newErrors.signature = 'Signature is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const documentData = {
      ...formData,
      category: category,
      numberOfLetters: parseInt(formData.numberOfLetters)
    }

    onSubmit(documentData)
  }

  return (
    <form onSubmit={handleSubmit} className="document-form">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="dateReceived">
            Date Received <span className="required">*</span>
          </label>
          <input
            type="date"
            id="dateReceived"
            name="dateReceived"
            value={formData.dateReceived}
            onChange={handleInputChange}
            required
            className={errors.dateReceived ? 'error' : ''}
          />
          {errors.dateReceived && (
            <span className="error-message">{errors.dateReceived}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="registryNumber">
            Registry Number <span className="required">*</span>
          </label>
          <input
            type="text"
            id="registryNumber"
            name="registryNumber"
            value={formData.registryNumber}
            onChange={handleInputChange}
            placeholder="e.g., REG-2024-001"
            required
            className={errors.registryNumber ? 'error' : ''}
          />
          {errors.registryNumber && (
            <span className="error-message">{errors.registryNumber}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="receivedFrom">
            Received From <span className="required">*</span>
          </label>
          <input
            type="text"
            id="receivedFrom"
            name="receivedFrom"
            value={formData.receivedFrom}
            onChange={handleInputChange}
            placeholder="e.g., Finance Division"
            required
            className={errors.receivedFrom ? 'error' : ''}
          />
          {errors.receivedFrom && (
            <span className="error-message">{errors.receivedFrom}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="dateOfLetter">
            Date of Letter <span className="required">*</span>
          </label>
          <input
            type="date"
            id="dateOfLetter"
            name="dateOfLetter"
            value={formData.dateOfLetter}
            onChange={handleInputChange}
            required
            className={errors.dateOfLetter ? 'error' : ''}
          />
          {errors.dateOfLetter && (
            <span className="error-message">{errors.dateOfLetter}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="numberOfLetters">
            Number of Letters <span className="required">*</span>
          </label>
          <input
            type="number"
            id="numberOfLetters"
            name="numberOfLetters"
            value={formData.numberOfLetters}
            onChange={handleInputChange}
            min="1"
            required
            className={errors.numberOfLetters ? 'error' : ''}
          />
          {errors.numberOfLetters && (
            <span className="error-message">{errors.numberOfLetters}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="signature">
            Signature <span className="required">*</span>
          </label>
          <input
            type="text"
            id="signature"
            name="signature"
            value={formData.signature}
            onChange={handleInputChange}
            placeholder="Enter signature"
            required
            className={errors.signature ? 'error' : ''}
          />
          {errors.signature && (
            <span className="error-message">{errors.signature}</span>
          )}
        </div>
      </div>

      <div className="form-group full-width">
        <label htmlFor="subject">
          Subject <span className="required">*</span>
        </label>
        <textarea
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          rows="4"
          placeholder="Enter subject of the document..."
          required
          className={errors.subject ? 'error' : ''}
        />
        {errors.subject && (
          <span className="error-message">{errors.subject}</span>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary">
          {initialData ? 'Update' : 'Submit'}
        </button>
      </div>
    </form>
  )
}

export default DocumentForm
