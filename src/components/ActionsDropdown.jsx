import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import './ActionsDropdown.css'

const GAP = 4

const ActionsDropdown = ({ children, 'aria-label': ariaLabel = 'Actions' }) => {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const right = window.innerWidth - triggerRect.right

    if (!menuRef.current) {
      setMenuPosition({ top: triggerRect.bottom + GAP, right })
      return
    }

    const menuHeight = menuRef.current.getBoundingClientRect().height
    const spaceBelow = window.innerHeight - triggerRect.bottom - GAP
    const spaceAbove = triggerRect.top - GAP
    const showAbove = spaceBelow < menuHeight && spaceAbove >= spaceBelow

    setMenuPosition({
      top: showAbove ? triggerRect.top - menuHeight - GAP : triggerRect.bottom + GAP,
      right
    })
  }, [open, children])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  return (
    <div className="actions-dropdown" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="actions-dropdown__trigger"
        onClick={() => setOpen(prev => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="actions-dropdown__ellipsis" aria-hidden>⋮</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="actions-dropdown__menu actions-dropdown__menu--overlay"
          role="menu"
          onClick={() => setOpen(false)}
          style={{
            top: menuPosition.top,
            right: menuPosition.right
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default ActionsDropdown
