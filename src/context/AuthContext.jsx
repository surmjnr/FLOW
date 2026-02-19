import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../services/mockApi'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('nca_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const onUserUpdated = (e) => {
      if (user?.id === e.detail?.id) {
        setUser(prev => (prev ? { ...prev, ...e.detail } : null))
      }
    }
    window.addEventListener('user-updated', onUserUpdated)
    return () => window.removeEventListener('user-updated', onUserUpdated)
  }, [user?.id])

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password)
      if (response.success) {
        setUser(response.user)
        localStorage.setItem('nca_user', JSON.stringify(response.user))
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('nca_user')
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const isSecretary = () => {
    return user?.role === 'secretary'
  }

  const isUser = () => {
    return user?.role === 'user'
  }

  const canRecord = () => {
    return user?.role === 'admin' || user?.role === 'secretary'
  }

  const canConfigureRecipient = () => {
    return user?.role === 'admin'
  }

  const canConfigureFormsOrLink = () => {
    return user?.role === 'admin' || user?.role === 'secretary'
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isSecretary,
    isUser,
    canRecord,
    canConfigureRecipient,
    canConfigureFormsOrLink
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
