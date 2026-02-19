import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import ConfigRecipient from './ConfigRecipient'
import ConfigForms from './ConfigForms'
import ConfigLink from './ConfigLink'
import ConfigUsers from './ConfigUsers'
import './Configuration.css'

const Configuration = () => {
  const { canConfigureFormsOrLink, canConfigureRecipient, isAdmin } = useAuth()
  const { fetchAll } = useConfig()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('forms')

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '')
    if (path.endsWith('forms')) setActiveTab('forms')
    else if (path.endsWith('link')) setActiveTab('link')
    else if (path.endsWith('users')) setActiveTab('users')
    else if (path.endsWith('configuration') || path.endsWith('recipient')) setActiveTab('recipient')
  }, [location.pathname])

  if (!canConfigureFormsOrLink()) {
    return <Navigate to="/receive" replace />
  }

  const showRecipient = canConfigureRecipient()
  const showUsers = isAdmin()
  const path = location.pathname.replace(/\/$/, '')
  if (!showRecipient && (path === '/configuration' || path.endsWith('/configuration') || path.endsWith('recipient'))) {
    return <Navigate to="/configuration/forms" replace />
  }
  if (!showUsers && path.endsWith('users')) {
    return <Navigate to="/configuration/forms" replace />
  }

  return (
    <div className="configuration-page">
      <div className="config-tabs">
        {showRecipient && (
          <NavLink
            to="/configuration"
            end
            className={({ isActive }) => `config-tab ${isActive ? 'active' : ''}`}
          >
            Division
          </NavLink>
        )}
        <NavLink
          to="/configuration/forms"
          className={({ isActive }) => `config-tab ${isActive ? 'active' : ''}`}
        >
          Forms
        </NavLink>
        <NavLink
          to="/configuration/link"
          className={({ isActive }) => `config-tab ${isActive ? 'active' : ''}`}
        >
          Link
        </NavLink>
        {showUsers && (
          <NavLink
            to="/configuration/users"
            className={({ isActive }) => `config-tab ${isActive ? 'active' : ''}`}
          >
            Users
          </NavLink>
        )}
      </div>
      <div className="config-content">
        {activeTab === 'recipient' && showRecipient && <ConfigRecipient />}
        {activeTab === 'forms' && <ConfigForms />}
        {activeTab === 'link' && <ConfigLink />}
        {activeTab === 'users' && showUsers && <ConfigUsers />}
      </div>
    </div>
  )
}

export default Configuration
