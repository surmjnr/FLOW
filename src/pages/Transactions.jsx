import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../context/TransactionContext'
import { format } from 'date-fns'
import ActionsDropdown from '../components/ActionsDropdown'
import SearchableDropdown from '../components/SearchableDropdown'
import './Transactions.css'

const Transactions = () => {
  const { user, isSecretary, canDelete } = useAuth()
  const { transactions, loading, removeTransaction } = useTransactions()
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    division: '',
    status: '',
    transactionType: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })

  const divisions = ['Finance', 'HR', 'IT', 'Operations', 'Marketing', 'Secretary']

  const divisionFilterOptions = [
    { value: '', label: 'All Divisions' },
    ...divisions.map((div) => ({ value: div, label: div }))
  ]
  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' }
  ]
  const typeFilterOptions = [
    { value: '', label: 'All Types' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Received', label: 'Received' }
  ]

  const filteredTransactions = useMemo(() => {
    let filtered = isSecretary()
      ? transactions
      : transactions.filter(
          t =>
            t.sendingDivision === user.division ||
            t.receivingDivision === user.division
        )

    if (filters.division) {
      filtered = filtered.filter(
        t =>
          t.sendingDivision === filters.division ||
          t.receivingDivision === filters.division
      )
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status)
    }

    if (filters.transactionType) {
      filtered = filtered.filter(t => t.transactionType === filters.transactionType)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        t =>
          t.documentTitle.toLowerCase().includes(searchLower) ||
          t.referenceNumber.toLowerCase().includes(searchLower)
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        t => new Date(t.date) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        t => new Date(t.date) <= new Date(filters.dateTo)
      )
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, filters, user, isSecretary])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await removeTransaction(id)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      division: '',
      status: '',
      transactionType: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  if (loading) {
    return <div className="loading">Loading transactions...</div>
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Document Transactions</h1>
        <Link to="/transactions/new" className="btn-primary">
          + New Transaction
        </Link>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Document title or reference..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Division</label>
            <SearchableDropdown
              options={divisionFilterOptions}
              value={filters.division}
              onChange={(value) => handleFilterChange('division', value)}
              placeholder="Search or select division..."
              ariaLabel="Division filter"
            />
          </div>

          <div className="filter-group">
            <label>Status</label>
            <SearchableDropdown
              options={statusFilterOptions}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Search or select status..."
              ariaLabel="Status filter"
            />
          </div>

          <div className="filter-group">
            <label>Type</label>
            <SearchableDropdown
              options={typeFilterOptions}
              value={filters.transactionType}
              onChange={(value) => handleFilterChange('transactionType', value)}
              placeholder="Search or select type..."
              ariaLabel="Type filter"
            />
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <button onClick={clearFilters} className="btn-secondary">
          Clear Filters
        </button>
      </div>

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found matching your filters.</p>
          </div>
        ) : (
          <div className="table-container">
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
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
                    <td>
                      <ActionsDropdown>
                        <Link
                          to={`/transactions/${transaction.id}`}
                          className="btn-view"
                        >
                          View
                        </Link>
                        {canDelete() && (
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        )}
                      </ActionsDropdown>
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

export default Transactions
