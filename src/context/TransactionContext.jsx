import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../services/mockApi'

const TransactionContext = createContext()

export const useTransactions = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }
  return context
}

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTransactions()
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const addTransaction = async (transactionData) => {
    try {
      const newTransaction = await createTransaction(transactionData)
      setTransactions(prev => [...prev, newTransaction])
      return { success: true, data: newTransaction }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const editTransaction = async (id, updates) => {
    try {
      const updated = await updateTransaction(id, updates)
      setTransactions(prev =>
        prev.map(t => (t.id === id ? updated : t))
      )
      return { success: true, data: updated }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const removeTransaction = async (id) => {
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const value = {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}
