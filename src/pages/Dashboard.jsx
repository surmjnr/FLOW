import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../context/TransactionContext'
import { format } from 'date-fns'
import './Dashboard.css'

const Dashboard = () => {
  const { user, isSecretary } = useAuth()
  const { transactions, loading } = useTransactions()

  const stats = useMemo(() => {
    const filtered = isSecretary()
      ? transactions
      : transactions.filter(
          t =>
            t.sendingDivision === user.division ||
            t.receivingDivision === user.division
        )

    const sent = filtered.filter(t => t.transactionType === 'Sent').length
    const received = filtered.filter(t => t.transactionType === 'Received').length
    const pending = filtered.filter(t => t.status === 'Pending').length
    const completed = filtered.filter(t => t.status === 'Completed').length

    return { total: filtered.length, sent, received, pending, completed }
  }, [transactions, user, isSecretary])

  const recentTransactions = useMemo(() => {
    const filtered = isSecretary()
      ? transactions
      : transactions.filter(
          t =>
            t.sendingDivision === user.division ||
            t.receivingDivision === user.division
        )

    return filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  }, [transactions, user, isSecretary])

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.division}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3498db' }}>
            📄
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Transactions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#2ecc71' }}>
            📤
          </div>
          <div className="stat-content">
            <h3>{stats.sent}</h3>
            <p>Documents Sent</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#9b59b6' }}>
            📥
          </div>
          <div className="stat-content">
            <h3>{stats.received}</h3>
            <p>Documents Received</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f39c12' }}>
            ⏳
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <Link to="/transactions" className="view-all-link">
            View All →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found.</p>
            <Link to="/transactions/new" className="btn-primary">
              Create First Transaction
            </Link>
          </div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Reference</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="transaction-link"
                      >
                        {transaction.documentTitle}
                      </Link>
                    </td>
                    <td>{transaction.referenceNumber}</td>
                    <td>{transaction.sendingDivision}</td>
                    <td>{transaction.receivingDivision}</td>
                    <td>
                      <span
                        className={`badge ${
                          transaction.transactionType === 'Sent'
                            ? 'badge-sent'
                            : 'badge-received'
                        }`}
                      >
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          transaction.status === 'Completed'
                            ? 'badge-completed'
                            : 'badge-pending'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
