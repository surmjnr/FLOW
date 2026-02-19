import React, { useState, useEffect } from 'react'
import { useDocuments } from '../context/DocumentContext'
import DocumentForm from '../components/DocumentForm'
import { format } from 'date-fns'
import ActionsDropdown from '../components/ActionsDropdown'
import './CategoryPage.css'

const CategoryPage = ({ category }) => {
  const { documents, loading, fetchDocuments, addDocument, editDocument, removeDocument } = useDocuments()
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)

  const categoriesWithStatus = ['DDG-T0', 'DG', 'ALL UNITS', 'All Divisions']
  const showStatus = categoriesWithStatus.includes(category)

  useEffect(() => {
    fetchDocuments(category)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'badge-confirmed'
      case 'rejected':
        return 'badge-rejected'
      case 'pending':
        return 'badge-pending'
      default:
        return 'badge-pending'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'rejected':
        return 'Rejected'
      case 'pending':
        return 'Pending'
      default:
        return 'Pending'
    }
  }

  const handleFormSubmit = async (formData) => {
    if (editingDoc) {
      await editDocument(editingDoc.id, formData)
      setEditingDoc(null)
    } else {
      await addDocument(formData)
    }
    setShowForm(false)
    fetchDocuments(category)
  }

  const handleEdit = (doc) => {
    setEditingDoc(doc)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await removeDocument(id)
      fetchDocuments(category)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingDoc(null)
  }

  if (loading) {
    return <div className="loading">Loading documents...</div>
  }

  return (
    <div className="category-page">
      <div className="page-header">
        <h1>{category}</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + New Document
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h2>{editingDoc ? 'Edit Document' : 'New Document'}</h2>
          <DocumentForm
            initialData={editingDoc}
            onSubmit={handleFormSubmit}
            category={category}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="documents-section">
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No documents found for {category}.</p>
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
                  {showStatus && <th>Status</th>}
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
                    {showStatus && (
                      <td>
                        <span className={`badge ${getStatusBadgeClass(doc.status || 'pending')}`}>
                          {getStatusLabel(doc.status || 'pending')}
                        </span>
                      </td>
                    )}
                    <td>
                      <ActionsDropdown>
                        <button onClick={() => handleEdit(doc)} className="btn-edit">
                          Edit
                        </button>
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

export default CategoryPage
