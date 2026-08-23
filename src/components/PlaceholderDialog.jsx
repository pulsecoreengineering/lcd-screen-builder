import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

export default function PlaceholderDialog({ open, onClose }) {
  const { state, dispatch } = useStore()
  const { cursorCol, cursorRow } = state
  const [name, setName] = useState('')
  const [width, setWidth] = useState(4)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName('')
      setWidth(4)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function confirm() {
    const clean = name.trim().replace(/[^a-zA-Z0-9_]/g, '_')
    if (!clean) return
    const w = Math.max(1, Math.min(16, parseInt(width) || 4))
    dispatch({ type: 'ADD_PLACEHOLDER', name: clean, col: cursorCol, row: cursorRow, width: w })
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') confirm()
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div className="name-dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="name-dialog-box">
        <div className="name-dialog-title">Insert Placeholder</div>
        <div className="name-dialog-sub">
          At col {cursorCol}, row {cursorRow}
        </div>
        <input
          ref={inputRef}
          className="name-dialog-input"
          placeholder="field_name"
          maxLength={16}
          autoComplete="off"
          spellCheck={false}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="name-dialog-label">Width (characters):</div>
        <input
          className="name-dialog-width"
          type="number"
          value={width}
          min={1}
          max={16}
          onChange={e => setWidth(e.target.value)}
        />
        <div className="name-dialog-row">
          <button className="nd-btn" onClick={onClose}>Cancel</button>
          <button className="nd-btn confirm" onClick={confirm}>Insert</button>
        </div>
      </div>
    </div>
  )
}
