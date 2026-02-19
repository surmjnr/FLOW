import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTransfersSentToUser, acceptTransfer, getFormById } from '../services/mockApi'
import './ReceivePage.css'

const getQuestionLabel = (form, key) => {
  if (!form?.questions) return key
  const q = form.questions.find(q => String(q.id) === String(key))
    ?? form.questions[typeof key === 'number' ? key : parseInt(key, 10)]
    ?? form.questions[key]
  return q?.label || q?.type || String(key)
}

const ReceivePage = () => {
  const { user, isAdmin } = useAuth()
  if (isAdmin()) return <Navigate to="/records" replace />
  const [transfers, setTransfers] = useState([])
  const [formsById, setFormsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState(null)

  const recipientId = user?.division || user?.id
  const recipientName = user?.name || user?.division || user?.username

  useEffect(() => {
    loadTransfers()
  }, [recipientId])

  useEffect(() => {
    const formIds = [...new Set(transfers.map(t => t.formId).filter(Boolean))]
    if (formIds.length === 0) return
    Promise.all(formIds.map(id => getFormById(id))).then(forms => {
      const map = {}
      formIds.forEach((id, i) => { if (forms[i]) map[id] = forms[i] })
      setFormsById(prev => ({ ...prev, ...map }))
    })
  }, [transfers])

  const loadTransfers = async () => {
    setLoading(true)
    try {
      const list = await getTransfersSentToUser(recipientId)
      setTransfers(list.filter(t => t.status === 'pending'))
    } catch (err) {
      alert('Failed to load pending transfers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    setActioningId(id)
    try {
      await acceptTransfer(id)
      setTransfers(prev => prev.filter(t => t.id !== id))
      window.dispatchEvent(new CustomEvent('receive-count-changed'))
    } catch (err) {
      alert('Failed to accept: ' + err.message)
    } finally {
      setActioningId(null)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="receive-page">
      <div className="receive-content">
        {transfers.length === 0 ? (
          <div className="empty-state">
            <p>No pending records sent to you.</p>
          </div>
        ) : (
          <div className="transfers-list">
            {transfers.map((t) => (
              <div key={t.id} className="transfer-card">
                <div className="transfer-header">
                  <span className="transfer-from">From: {t.sentByName || t.sentBy}</span>
                </div>
                <div className="transfer-status">
                  <span className="badge badge-pending">Pending</span>
                </div>
                <div className="transfer-form-data">
                  <table className="data-table">
                    <tbody>
                      {Object.entries(t.formData || {}).map(([key, value]) => (
                        <tr key={key}>
                          <td className="data-key">{getQuestionLabel(formsById[t.formId], key)}</td>
                          <td className="data-value">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="transfer-actions">
                  <button
                    type="button"
                    className="btn-primary btn-accept"
                    onClick={() => handleAccept(t.id)}
                    disabled={actioningId !== null}
                  >
                    {actioningId === t.id ? 'Accepting...' : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceivePage
