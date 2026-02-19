import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDocuments } from '../context/DocumentContext'
import { format } from 'date-fns'
import ActionsDropdown from '../components/ActionsDropdown'
import './IncomingPage.css'

const IncomingPage = () => {
  const { user } = useAuth()
  const { documents, loading, fetchIncomingDocuments, removeDocument } = useDocuments()

  useEffect(() => {
    if (user?.division) {
      fetchIncomingDocuments(user.division)
    }
  }, [user])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await removeDocument(id)
      if (user?.division) {
        fetchIncomingDocuments(user.division)
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading incoming documents...</div>
  }

  return (
    <div className="incoming-page">
      <div className="page-header">
        <h1>Incoming Documents</h1>
      </div>

      <div className="documents-section">
        <p className="section-description">
          Documents sent to {user?.division || 'your division'}
        </p>
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No incoming documents found.</p>
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
                    <td>
                      <ActionsDropdown>
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

export default IncomingPage
