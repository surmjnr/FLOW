import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import './Layout.css'

const getPageTitle = (pathname) => {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/send') return 'Send'
  if (path === '/receive') return 'Receive'
  if (path === '/records') return 'Records'
  if (path === '/configuration' || path.startsWith('/configuration')) {
    if (path.endsWith('forms')) return 'Configuration · Forms'
    if (path.endsWith('link')) return 'Configuration · Link'
    return 'Configuration · Division'
  }
  return 'Send'
}

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const showSidebar = user?.role === 'admin' || user?.role === 'secretary'
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  return (
    <div className={`layout ${!showSidebar ? 'layout--no-sidebar' : ''} ${showSidebar && !sidebarOpen ? 'layout--sidebar-closed' : ''}`}>
      {showSidebar && (
        <>
          <div
            className="sidebar-overlay"
            aria-hidden={!sidebarOpen}
            onClick={toggleSidebar}
          />
          <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
        </>
      )}
      <div className="main-container">
        <header className="topbar">
          <div className="topbar-content">
            {showSidebar && (
              <button
                type="button"
                className="topbar-hamburger"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? 'Close side panel' : 'Open side panel'}
                aria-expanded={sidebarOpen}
              >
                <span className="topbar-hamburger__line" />
                <span className="topbar-hamburger__line" />
                <span className="topbar-hamburger__line" />
              </button>
            )}
            <div className="user-info">
              <span>{user?.name || user?.division}</span>
              <span className="user-role">({user?.role === 'admin' ? 'Admin' : user?.role === 'secretary' ? 'Secretary' : 'User'})</span>
            </div>
            <h1 className="topbar-page-title">{pageTitle}</h1>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
