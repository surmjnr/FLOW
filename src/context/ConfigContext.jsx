import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  getRecipients,
  createRecipient as apiCreateRecipient,
  updateRecipient as apiUpdateRecipient,
  deleteRecipient as apiDeleteRecipient,
  getForms,
  createForm as apiCreateForm,
  updateForm as apiUpdateForm,
  deleteForm as apiDeleteForm,
  getLinks,
  createLink as apiCreateLink,
  deleteLink as apiDeleteLink,
  getLinkByRecipient
} from '../services/mockApi'

const ConfigContext = createContext()

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

export const ConfigProvider = ({ children }) => {
  const [recipients, setRecipients] = useState([])
  const [forms, setForms] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchRecipients = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecipients()
      setRecipients(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchForms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getForms()
      setForms(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLinks()
      setLinks(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [r, f, l] = await Promise.all([getRecipients(), getForms(), getLinks()])
      setRecipients(r)
      setForms(f)
      setLinks(l)
    } finally {
      setLoading(false)
    }
  }, [])

  const createRecipient = async (name) => {
    const created = await apiCreateRecipient(name)
    setRecipients(prev => [...prev, created])
    return created
  }

  const updateRecipient = async (id, updates) => {
    const updated = await apiUpdateRecipient(id, updates)
    setRecipients(prev => prev.map(r => (r.id === id ? updated : r)))
    return updated
  }

  const removeRecipient = async (id) => {
    await apiDeleteRecipient(id)
    setRecipients(prev => prev.filter(r => r.id !== id))
    setLinks(prev => prev.filter(l => l.recipientId !== id))
  }

  const createForm = async (formData) => {
    const created = await apiCreateForm(formData)
    setForms(prev => [...prev, created])
    return created
  }

  const updateForm = async (id, updates) => {
    const updated = await apiUpdateForm(id, updates)
    setForms(prev => prev.map(f => (f.id === id ? updated : f)))
    return updated
  }

  const removeForm = async (id) => {
    await apiDeleteForm(id)
    setForms(prev => prev.filter(f => f.id !== id))
    setLinks(prev => prev.filter(l => l.formId !== id))
  }

  const linkFormToRecipient = async (recipientId, formId) => {
    const link = await apiCreateLink(recipientId, formId)
    const existing = links.find(l => l.recipientId === recipientId)
    if (existing) {
      setLinks(prev => prev.map(l => (l.recipientId === recipientId ? { ...l, formId } : l)))
    } else {
      setLinks(prev => [...prev, link])
    }
    return link
  }

  const unlink = async (linkId) => {
    await apiDeleteLink(linkId)
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  const getFormForRecipient = useCallback((recipientId) => {
    const link = links.find(l => l.recipientId === recipientId)
    if (!link) return null
    return forms.find(f => f.id === link.formId) || null
  }, [links, forms])

  const value = {
    recipients,
    forms,
    links,
    loading,
    fetchRecipients,
    fetchForms,
    fetchLinks,
    fetchAll,
    createRecipient,
    updateRecipient,
    removeRecipient,
    createForm,
    updateForm,
    removeForm,
    linkFormToRecipient,
    unlink,
    getFormForRecipient
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}
