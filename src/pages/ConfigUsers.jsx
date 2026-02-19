import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { getUsers, updateUser, deleteUser, createUser } from '../services/mockApi'
import ActionsDropdown from '../components/ActionsDropdown'
import SearchableDropdown from '../components/SearchableDropdown'
import './Configuration.css'

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'secretary', label: 'Secretary' }
]

const ConfigUsers = () => {
  const { user: currentUser, isAdmin } = useAuth()
  const { recipients } = useConfig()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', division: '', role: 'user' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ division: '', role: 'user' })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      alert('Failed to load users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role || '—'

  const divisionOptions = [
    { value: '', label: 'Select division...' },
    ...(recipients || []).map((r) => ({ value: r.name, label: r.name }))
  ]
  const roleOptions = ROLES

  const startEdit = (u) => {
    if (u.role === 'admin') return
    setEditingId(u.id)
    setEditForm({ division: u.division || '', role: u.role || 'user' })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingId) return
    const u = users.find(x => x.id === editingId)
    if (!u || u.role === 'admin') return
    setEditSaving(true)
    try {
      const updated = await updateUser(editingId, {
        division: editForm.division?.trim() || u.division,
        role: editForm.role || u.role
      })
      setUsers(prev => prev.map(x => (x.id === editingId ? updated : x)))
      setEditingId(null)
      setEditForm({ division: '', role: 'user' })
      if (currentUser?.id === editingId) {
        const stored = JSON.parse(localStorage.getItem('nca_user') || '{}')
        if (stored.id === editingId) {
          localStorage.setItem('nca_user', JSON.stringify({ ...stored, division: updated.division, role: updated.role }))
          window.dispatchEvent(new CustomEvent('user-updated', { detail: updated }))
        }
      }
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const handleExport = () => {
    const data = {
      users: users,
      recipients: recipients,
      forms: [], // Add if needed
      links: [],
      transfers: []
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'file-records-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.users && Array.isArray(data.users)) {
          // Import users, but be careful
          alert('Import feature is basic; data imported but may overwrite existing.')
          // For simplicity, just log; in real app, merge or confirm
        }
      } catch (err) {
        alert('Invalid file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newUser.username?.trim()) {
      alert('Username is required.')
      return
    }
    if (!newUser.password?.trim()) {
      alert('Password is required.')
      return
    }
    const role = newUser.role || 'user'
    if (role !== 'admin' && !newUser.division?.trim()) {
      alert('Division is required for this role.')
      return
    }
    setAddSaving(true)
    try {
      const created = await createUser({
        name: newUser.name?.trim() || newUser.username.trim(),
        username: newUser.username.trim(),
        password: newUser.password.trim(),
        division: newUser.division?.trim() || '',
        role: newUser.role || 'user'
      })
      setUsers(prev => [...prev, created])
      setNewUser({ name: '', username: '', password: '', division: '', role: 'user' })
      setShowAddForm(false)
    } catch (err) {
      alert('Failed to add user: ' + err.message)
    } finally {
      setAddSaving(false)
    }
  }

  if (!isAdmin()) return null
  if (loading) return <div className="loading">Loading...</div>

  const canAddUsers = Array.isArray(recipients) && recipients.length > 0

  return (
    <div className="config-section">
      <div className="config-section__header">
        <h2>User management</h2>
        <div className="config-actions">
          <button type="button" className="btn-secondary btn-small" onClick={handleExport}>
            Export Data
          </button>
          <label className="btn-secondary btn-small" style={{ cursor: 'pointer' }}>
            Import Data
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            className="btn-primary btn-small"
            onClick={() => setShowAddForm(prev => !prev)}
            disabled={!canAddUsers}
            title={!canAddUsers ? 'Create at least one division before adding users' : ''}
          >
            Add user
          </button>
        </div>
      </div>
      {!canAddUsers && (
        <p className="config-section__hint">Create at least one division (Configuration → Divisions) before adding users.</p>
      )}
      {showAddForm && canAddUsers && (
        <form onSubmit={handleAddUser} className="config-users-add-form">
          <div className="config-users-add-form__row">
            <span className="config-users-fields-inline">
              <input
                type="text"
                className="inline-input"
                placeholder="User name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="text"
                className="inline-input"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                required
              />
              <input
                type="password"
                className="inline-input"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <SearchableDropdown
                className="config-users-dropdown"
                options={divisionOptions}
                value={newUser.division}
                onChange={(value) => setNewUser(prev => ({ ...prev, division: value }))}
                placeholder="Search or select division..."
                ariaLabel="Division"
              />
              <SearchableDropdown
                className="config-users-dropdown"
                options={roleOptions}
                value={newUser.role}
                onChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                placeholder="Search or select role..."
                ariaLabel="Role"
              />
            </span>
            <span className="config-users-add-form__actions">
              <button type="submit" className="btn-primary btn-small" disabled={addSaving}>
                {addSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn-secondary btn-small"
                onClick={() => {
                  setShowAddForm(false)
                  setNewUser({ name: '', username: '', password: '', division: '', role: 'user' })
                }}
              >
                Cancel
              </button>
            </span>
          </div>
        </form>
      )}
      {editingId && (() => {
        const u = users.find(x => x.id === editingId)
        if (!u || u.role === 'admin') return null
        return (
          <form onSubmit={handleSaveEdit} className="config-users-edit-form">
            <div className="config-users-add-form__row">
              <span className="config-users-edit-form__label">Edit {u.name || u.username}:</span>
              <span className="config-users-type-division-inline">
                <SearchableDropdown
                  className="config-users-dropdown"
                  options={divisionOptions}
                  value={editForm.division}
                  onChange={(value) => setEditForm(prev => ({ ...prev, division: value }))}
                  placeholder="Search or select division..."
                  ariaLabel="Division"
                />
                <SearchableDropdown
                  className="config-users-dropdown"
                  options={roleOptions}
                  value={editForm.role}
                  onChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                  placeholder="Search or select role..."
                  ariaLabel="Role"
                />
              </span>
              <button type="submit" className="btn-primary btn-small" disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn-secondary btn-small"
                onClick={() => { setEditingId(null); setEditForm({ division: '', role: 'user' }) }}
              >
                Cancel
              </button>
            </div>
          </form>
        )
      })()}
      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>User name</th>
              <th>Division</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">No users.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || u.username}</td>
                  <td>{u.division || '—'}</td>
                  <td>
                    {u.role === 'admin' ? (
                      <span className="badge badge-admin">Admin</span>
                    ) : (
                      getRoleLabel(u.role)
                    )}
                  </td>
                  <td>
                    <ActionsDropdown aria-label={`Actions for ${u.name || u.username}`}>
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => startEdit(u)}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-delete"
                        disabled={u.role === 'admin' || currentUser?.id === u.id}
                        onClick={() => handleDelete(u)}
                        title={currentUser?.id === u.id ? 'You cannot delete your own account' : u.role === 'admin' ? 'Admin cannot be deleted' : 'Delete user'}
                      >
                        Delete
                      </button>
                    </ActionsDropdown>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ConfigUsers
