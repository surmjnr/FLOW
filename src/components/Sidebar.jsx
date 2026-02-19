import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTransfersSentToUser } from '../services/mockApi'
import './Sidebar.css'

const Sidebar = ({ isOpen = true, onClose }) => {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const [receiveCount, setReceiveCount] = useState(0)

  const fetchReceiveCount = useCallback(() => {
    const divisionOrId = user?.division || user?.id
    if (!divisionOrId) return
    getTransfersSentToUser(divisionOrId).then(list => {
      const count = list.filter(t => t.status === 'pending').length
      setReceiveCount(count)
    })
  }, [user?.division, user?.id])

  useEffect(() => {
    fetchReceiveCount()
  }, [fetchReceiveCount, location.pathname])

  useEffect(() => {
    const onReceiveCountChanged = () => fetchReceiveCount()
    window.addEventListener('receive-count-changed', onReceiveCountChanged)
    return () => window.removeEventListener('receive-count-changed', onReceiveCountChanged)
  }, [fetchReceiveCount])

  const canRecord = user?.role === 'admin' || user?.role === 'secretary'
  const canConfigure = canRecord
  const showSendAndReceive = !isAdmin()

  const sidebarItems = [
    ...(showSendAndReceive && canRecord ? [{ path: '/send', label: 'Send' }] : []),
    ...(showSendAndReceive ? [{ path: '/receive', label: 'Receive', badge: receiveCount }] : []),
    { path: '/records', label: 'Records' }
  ]

  const isActive = (path) => {
    if (path === '/configuration') {
      return location.pathname.startsWith('/configuration')
    }
    return location.pathname === path
  }

  return (
    <div className={`sidebar ${!isOpen ? 'sidebar--closed' : ''}`}>
      <div className="sidebar-header">
        <h2>FLOW</h2>
        {onClose && (
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close side panel"
          >
            ×
          </button>
        )}
      </div>
      <nav className="sidebar-nav">
        {sidebarItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
          >
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="sidebar-item__badge">{item.badge}</span>
            )}
          </Link>
        ))}
        {canConfigure && (
          <Link
            to={user?.role === 'admin' ? '/configuration' : '/configuration/forms'}
            className={`sidebar-item ${isActive('/configuration') ? 'active' : ''}`}
          >
            Configuration
          </Link>
        )}
      </nav>
    </div>
  )
}

export default Sidebar
