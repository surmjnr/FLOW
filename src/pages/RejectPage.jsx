import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDocuments } from '../context/DocumentContext'
import { format } from 'date-fns'
import ActionsDropdown from '../components/ActionsDropdown'
import './RejectPage.css'

const RejectPage = () => {
  const { user, isAdmin } = useAuth()
  const { documents, loading, fetchRejectedDocuments, removeDocument, rejectDoc } = useDocuments()
  const [rejectingDoc, setRejectingDoc] = useState(null)
  const [rejectionNote, setRejectionNote] = useState('')

  useEffect(() => {
    fetchRejectedDocuments(isAdmin() ? null : user?.division)
  }, [user, isAdmin])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await removeDocument(id)
      fetchRejectedDocuments(isAdmin() ? null : user?.division)
    }
  }

  const handleReject = (doc) => {
    setRejectingDoc(doc)
    setRejectionNote(doc.rejectionNote || '')
  }

  const handleRejectSubmit = async () => {
    if (!rejectionNote.trim()) {
      alert('Please provide a rejection note')
      return
    }

    await rejectDoc(rejectingDoc.id, rejectionNote)
    setRejectingDoc(null)
    setRejectionNote('')
    fetchRejectedDocuments(isAdmin() ? null : user?.division)
  }

  const handleCancel = () => {
    setRejectingDoc(null)
    setRejectionNote('')
  }

  if (loading) {
    return <div className="loading">Loading rejected documents...</div>
  }

  return (
    <div className="reject-page">
      <div className="page-header">
        <h1>Rejected Documents</h1>
      </div>

      {rejectingDoc && (
        <div className="reject-modal">
          <div className="reject-modal-content">
            <h2>Reject Document</h2>
            <div className="form-group">
              <label>Rejection Note <span className="required">*</span></label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows="4"
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="form-actions">
              <button onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleRejectSubmit} className="btn-primary">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="documents-section">
        <p className="section-description">
          {isAdmin() ? 'All rejected documents' : `Rejected documents for ${user?.division || 'your division'}`}
        </p>
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No rejected documents found.</p>
          </div>
        ) : (
          <div className="documents-table">
            <table>
              <thead>
                <tr>
                  <th>Date Received</th>
                  <th>Registry Number</th>
                  <th>Received From</th>
                  <th>Date of Letter</th>
                  <th>No. of Letters</th>
                  <th>Subject</th>
                  <th>Signature</th>
                  <th>Rejection Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>{format(new Date(doc.dateReceived), 'MMM dd, yyyy')}</td>
                    <td>{doc.registryNumber}</td>
                    <td>{doc.receivedFrom}</td>
                    <td>{format(new Date(doc.dateOfLetter), 'MMM dd, yyyy')}</td>
                    <td>{doc.numberOfLetters}</td>
                    <td className="subject-cell">{doc.subject}</td>
                    <td>{doc.signature}</td>
                    <td className="rejection-note-cell">
                      {doc.rejectionNote || 'N/A'}
                    </td>
                    <td>
                      <ActionsDropdown>
                        {!doc.rejected && (
                          <button onClick={() => handleReject(doc)} className="btn-reject">
                            Reject
                          </button>
                        )}
                        <button onClick={() => handleDelete(doc.id)} className="btn-delete">
                          Delete
                        </button>
                      </ActionsDropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default RejectPage
