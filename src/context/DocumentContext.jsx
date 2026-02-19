import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getDocuments,
  getIncomingDocuments,
  getRejectedDocuments,
  getCompletedDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  rejectDocument
} from '../services/mockApi'

const DocumentContext = createContext()

export const useDocuments = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider')
  }
  return context
}

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDocuments = async (category = null) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDocuments(category)
      setDocuments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchIncomingDocuments = async (userDivision) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getIncomingDocuments(userDivision)
      setDocuments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRejectedDocuments = async (userDivision = null) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRejectedDocuments(userDivision)
      setDocuments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedDocuments = async (userDivision = null) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCompletedDocuments(userDivision)
      setDocuments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addDocument = async (documentData) => {
    try {
      const newDocument = await createDocument(documentData)
      setDocuments(prev => [...prev, newDocument])
      return { success: true, data: newDocument }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const editDocument = async (id, updates) => {
    try {
      const updated = await updateDocument(id, updates)
      setDocuments(prev =>
        prev.map(d => (d.id === id ? updated : d))
      )
      return { success: true, data: updated }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const removeDocument = async (id) => {
    try {
      await deleteDocument(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const rejectDoc = async (id, rejectionNote) => {
    try {
      const rejected = await rejectDocument(id, rejectionNote)
      setDocuments(prev =>
        prev.map(d => (d.id === id ? rejected : d))
      )
      return { success: true, data: rejected }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const value = {
    documents,
    loading,
    error,
    fetchDocuments,
    fetchIncomingDocuments,
    fetchRejectedDocuments,
    fetchCompletedDocuments,
    addDocument,
    editDocument,
    removeDocument,
    rejectDoc
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}
