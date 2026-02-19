import React, { useState, useRef, useEffect } from 'react'
import './SearchableDropdown.css'

/**
 * Reusable searchable dropdown. Options are filtered by label (case-insensitive).
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} value - selected value
 * @param {(value: string) => void} onChange
 * @param {string} placeholder
 * @param {string} [className]
 * @param {string} [id] - for aria-labelledby
 * @param {string} [ariaLabel]
 * @param {boolean} [disabled]
 */
const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Search or select...',
  className = '',
  id,
  ariaLabel = 'Choose option',
  disabled = false
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selectedOption = options.find((o) => o.value === value)
  /* When no value selected, show empty so placeholder is visible; otherwise show selected label */
  const displayLabel = value === '' ? '' : (selectedOption?.label ?? '')
  const inputValue = open ? search : displayLabel

  const filtered = options.filter((o) =>
    !search.trim() || o.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleFocus = () => {
    if (disabled) return
    setOpen(true)
    setSearch(displayLabel)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      setSearch('')
    }, 150)
  }

  const handleChange = (e) => {
    setSearch(e.target.value)
    setOpen(true)
    if (!e.target.value.trim()) onChange('')
  }

  const handleSelect = (optValue) => (e) => {
    e.preventDefault()
    onChange(optValue)
    setOpen(false)
    setSearch('')
    inputRef.current?.blur()
  }

  return (
    <div
      ref={containerRef}
      className={`searchable-dropdown ${className}`.trim()}
      onBlur={handleBlur}
    >
      <div className="searchable-dropdown__input-row">
        <input
          ref={inputRef}
          type="text"
          className={`searchable-dropdown__input${className.includes('error') ? ' error' : ''}`}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={open ? '' : placeholder}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-controls={id ? `${id}-list` : undefined}
          id={id}
          autoComplete="off"
          disabled={disabled}
          readOnly={disabled}
        />
      </div>
      {open && (
        <ul
          id={id ? `${id}-list` : undefined}
          className="searchable-dropdown__list"
          role="listbox"
          aria-label={ariaLabel}
        >
          {filtered.length === 0 ? (
            <li className="searchable-dropdown__item searchable-dropdown__item--empty" role="option">
              No matches
            </li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.value}
                className="searchable-dropdown__item"
                role="option"
                aria-selected={value === opt.value}
                onMouseDown={handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default SearchableDropdown
