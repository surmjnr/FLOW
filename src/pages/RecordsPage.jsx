import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import SearchableDropdown from '../components/SearchableDropdown'
import {
  getRecipients,
  getUsers,
  getDefaultUserRecipientId,
  getTransfersByRecipientAll,
  getTransfersInternalAll,
  getTransfersInternalByUserAll,
  cancelTransfer
} from '../services/mockApi'
import { format } from 'date-fns'
import './RecordsPage.css'

const TYPE_INTERNAL = 'internal'
const TYPE_DIVISION = 'division'
const INTERNAL_ALL_ID = '__internal_all__'

const RecordsPage = () => {
  const { user, isAdmin, canRecord } = useAuth()
  const { fetchAll, getFormForRecipient } = useConfig()
  const [selectionType, setSelectionType] = useState(TYPE_INTERNAL)
  const [selectedDivisionId, setSelectedDivisionId] = useState('')
  const [selectedInternalOption, setSelectedInternalOption] = useState(null) // null | '__internal_all__' | user object
  const [divisions, setDivisions] = useState([])
  const [users, setUsers] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const defaultUserRecipientId = getDefaultUserRecipientId()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const load = async () => {
      setOptionsLoading(true)
      try {
        const [recipients, userList] = await Promise.all([
          getRecipients(),
          getUsers()
        ])
        const divisionList = (recipients || []).filter(
          r => r.id !== defaultUserRecipientId
        )
        setDivisions(divisionList)
        if (isAdmin()) {
          setUsers(userList || [])
        } else {
          const myDivision = user?.division
          setUsers(
            (userList || []).filter(
              u => u.division === myDivision || u.id === user?.id
            )
          )
        }
      } catch (err) {
        alert('Failed to load users and divisions. Please try refreshing the page.')
      } finally {
        setOptionsLoading(false)
      }
    }
    load()
  }, [user, isAdmin, defaultUserRecipientId])

  const loadTransfers = () => {
    if (selectionType === TYPE_DIVISION && selectedDivisionId) {
      setLoading(true)
      getTransfersByRecipientAll(selectedDivisionId)
        .then(setTransfers)
        .catch(() => setTransfers([]))
        .finally(() => setLoading(false))
    } else if (selectionType === TYPE_INTERNAL && selectedInternalOption) {
      setLoading(true)
      const isAll =
        selectedInternalOption === INTERNAL_ALL_ID ||
        (selectedInternalOption && selectedInternalOption.id === INTERNAL_ALL_ID)
      ;(isAll
        ? getTransfersInternalAll()
        : getTransfersInternalByUserAll(selectedInternalOption))
        .then(setTransfers)
        .catch(() => setTransfers([]))
        .finally(() => setLoading(false))
    } else {
      setTransfers([])
    }
  }

  useEffect(() => {
    loadTransfers()
  }, [selectionType, selectedDivisionId, selectedInternalOption])

  useEffect(() => {
    const onTransfersChanged = () => {
      if (selectionType === TYPE_DIVISION && selectedDivisionId) {
        getTransfersByRecipientAll(selectedDivisionId).then(setTransfers).catch(() => {})
      } else if (selectionType === TYPE_INTERNAL && selectedInternalOption) {
        const isAll =
          selectedInternalOption === INTERNAL_ALL_ID ||
          (selectedInternalOption && selectedInternalOption.id === INTERNAL_ALL_ID)
        ;(isAll ? getTransfersInternalAll() : getTransfersInternalByUserAll(selectedInternalOption))
          .then(setTransfers)
          .catch(() => {})
      }
    }
    window.addEventListener('transfers-changed', onTransfersChanged)
    window.addEventListener('receive-count-changed', onTransfersChanged)
    return () => {
      window.removeEventListener('transfers-changed', onTransfersChanged)
      window.removeEventListener('receive-count-changed', onTransfersChanged)
    }
  }, [selectionType, selectedDivisionId, selectedInternalOption])

  const onTypeChange = (e) => {
    const v = e.target.value
    setSelectionType(v)
    setSelectedDivisionId('')
    setSelectedInternalOption(null)
    setTransfers([])
  }

  const onDivisionChange = (e) => {
    const id = e.target.value
    setSelectedDivisionId(id)
    setSelectedInternalOption(null)
  }

  const onInternalOptionChange = (e) => {
    const id = e.target.value
    if (!id) {
      setSelectedInternalOption(null)
    } else if (id === INTERNAL_ALL_ID) {
      setSelectedInternalOption({ id: INTERNAL_ALL_ID })
    } else {
      setSelectedInternalOption(users.find(u => u.id === id) || null)
    }
    if (id) setSelectedDivisionId('')
  }

  const hasSelection =
    (selectionType === TYPE_DIVISION && selectedDivisionId) ||
    (selectionType === TYPE_INTERNAL && selectedInternalOption)

  const internalSelectValue =
    !selectedInternalOption
      ? ''
      : selectedInternalOption.id === INTERNAL_ALL_ID
        ? INTERNAL_ALL_ID
        : selectedInternalOption.id

  const internalDisplayLabel =
    !selectedInternalOption
      ? '— Select —'
      : selectedInternalOption.id === INTERNAL_ALL_ID
        ? 'All internal records'
        : selectedInternalOption.name || selectedInternalOption.username || '— Select —'

  const divisionDisplayLabel =
    !selectedDivisionId
      ? '— Select a division —'
      : (divisions.find(d => d.id === selectedDivisionId)?.name) || '— Select a division —'

  const handleInternalSelect = (value) => {
    if (!value) {
      setSelectedInternalOption(null)
    } else if (value === INTERNAL_ALL_ID) {
      setSelectedInternalOption({ id: INTERNAL_ALL_ID })
    } else {
      setSelectedInternalOption(users.find(u => u.id === value) || null)
    }
    setSelectedDivisionId('')
  }

  const handleDivisionSelect = (value) => {
    setSelectedDivisionId(value || '')
    setSelectedInternalOption(null)
  }

  const linkedForm =
    selectionType === TYPE_DIVISION && selectedDivisionId
      ? getFormForRecipient(selectedDivisionId)
      : selectionType === TYPE_INTERNAL && selectedInternalOption
        ? getFormForRecipient(defaultUserRecipientId)
        : null
  const questionColumns = linkedForm?.questions || []

  const getFormDataValue = (transfer, q, idx) => {
    const key = q.id ?? idx
    const val = transfer.formData?.[key]
    if (val == null) return '—'
    if (q.type === 'date' && val) {
      try {
        return format(new Date(val), 'MMM dd, yyyy')
      } catch (_) {
        return String(val)
      }
    }
    return String(val)
  }

  const getStatusLabel = (status) => {
    if (status === 'accepted') return 'Delivered'
    if (status === 'cancelled') return 'Cancelled'
    return 'Pending'
  }

  const getStatusBadgeClass = (status) => {
    if (status === 'accepted') return 'badge-delivered'
    if (status === 'cancelled') return 'badge-cancelled'
    return 'badge-pending'
  }

  const handleCancel = async (id) => {
    if (!canRecord()) return
    setCancellingId(id)
    try {
      await cancelTransfer(id)
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
      window.dispatchEvent(new CustomEvent('receive-count-changed'))
      window.dispatchEvent(new CustomEvent('transfers-changed'))
    } catch (err) {
      alert('Failed to cancel: ' + err.message)
    } finally {
      setCancellingId(null)
    }
  }

  if (optionsLoading) {
    return <div className="loading">Loading options...</div>
  }

  return (
    <div className="records-page">
      <div className="records-section">
        <div className="records-selection">
          <div className="view-by-row">
            <div className="view-by-label">View records by</div>
            <div className="view-by-radios">
              <label className="view-by-radio">
                <input
                  type="radio"
                  name="recordsType"
                  value={TYPE_INTERNAL}
                  checked={selectionType === TYPE_INTERNAL}
                  onChange={onTypeChange}
                />
                <span className="view-by-radio-label">Internal</span>
              </label>
              <label className="view-by-radio">
                <input
                  type="radio"
                  name="recordsType"
                  value={TYPE_DIVISION}
                  checked={selectionType === TYPE_DIVISION}
                  onChange={onTypeChange}
                />
                <span className="view-by-radio-label">Division</span>
              </label>
            </div>

            {selectionType === TYPE_INTERNAL && (
              <div className="view-by-dropdown--inline" style={{ minWidth: 260 }}>
                <SearchableDropdown
                  options={[
                    { value: '', label: '— Select —' },
                    { value: INTERNAL_ALL_ID, label: 'All internal records' },
                    ...users.map((u) => ({ value: u.id, label: u.name || u.username || '—' }))
                  ]}
                  value={internalSelectValue}
                  onChange={handleInternalSelect}
                  placeholder="Search or select person..."
                  ariaLabel="Show internal records"
                />
              </div>
            )}

            {selectionType === TYPE_DIVISION && (
              <div className="view-by-dropdown--inline" style={{ minWidth: 260 }}>
                <SearchableDropdown
                  options={[
                    { value: '', label: '— Select a division —' },
                    ...divisions.map((d) => ({ value: d.id, label: d.name }))
                  ]}
                  value={selectedDivisionId}
                  onChange={handleDivisionSelect}
                  placeholder="Search or select division..."
                  ariaLabel="Choose division"
                />
              </div>
            )}
            </div>
        </div>

        {!hasSelection && (
          <div className="empty-state records-prompt">
            <p>
              {selectionType === TYPE_INTERNAL
                ? 'Choose "All internal records" or a person to view their records.'
                : 'Select a division above to view its records.'}
            </p>
          </div>
        )}

        {hasSelection && (
          <>
            {loading ? (
              <div className="loading">Loading records...</div>
            ) : transfers.length === 0 ? (
              <div className="empty-state">
                <p>No records found for this selection.</p>
              </div>
            ) : (
              <div className="records-table">
                <table>
                  <thead>
                    <tr>
                      <th>Sent by</th>
                      {questionColumns.map((q, idx) => (
                        <th
                          key={q.id ?? idx}
                          className={
                            q.type === 'long'
                              ? 'records-cell--long'
                              : q.type === 'short'
                                ? 'records-cell--short'
                                : ''
                          }
                        >
                          {q.label || q.type || `Field ${idx + 1}`}
                        </th>
                      ))}
                      <th>Date</th>
                      <th>Status</th>
                      {canRecord() && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr key={t.id}>
                        <td>{t.sentByName || t.sentBy}</td>
                        {questionColumns.map((q, idx) => (
                          <td
                            key={q.id ?? idx}
                            className={
                              q.type === 'long'
                                ? 'records-cell--long'
                                : q.type === 'short'
                                  ? 'records-cell--short'
                                  : ''
                            }
                          >
                            {getFormDataValue(t, q, idx)}
                          </td>
                        ))}
                        <td>
                          {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(t.status || 'pending')}`}>
                            {getStatusLabel(t.status || 'pending')}
                          </span>
                        </td>
                        {canRecord() && (
                          <td>
                            {t.status === 'pending' && (
                              <button
                                type="button"
                                className="records-cancel-btn"
                                onClick={() => handleCancel(t.id)}
                                disabled={cancellingId !== null}
                              >
                                {cancellingId === t.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RecordsPage
