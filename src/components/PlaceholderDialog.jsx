import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

// editTarget: null = insert mode, { index, name, col, row, width } = edit mode
export default function PlaceholderDialog({ open, onClose, editTarget }) {
  const { state, dispatch } = useStore()
  const { cursorCol, cursorRow } = state
  const isEdit = editTarget != null

  const [name, setName] = useState('')
  const [col, setCol] = useState(0)
  const [row, setRow] = useState(0)
  const [width, setWidth] = useState(4)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      setName(editTarget.name)
      setCol(editTarget.col)
      setRow(editTarget.row)
      setWidth(editTarget.width)
    } else {
      setName('')
      setCol(cursorCol)
      setRow(cursorRow)
      setWidth(4)
    }
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  function confirm() {
    const clean = name.trim().replace(/[^a-zA-Z0-9_]/g, '_')
    if (!clean) return
    const w = Math.max(1, Math.min(20, parseInt(width) || 4))
    const c = Math.max(0, parseInt(col) || 0)
    const r = Math.max(0, parseInt(row) || 0)
    if (isEdit) {
      dispatch({ type: 'EDIT_PLACEHOLDER', index: editTarget.index, changes: { name: clean, col: c, row: r, width: w } })
    } else {
      dispatch({ type: 'ADD_PLACEHOLDER', name: clean, col: c, row: r, width: w })
    }
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
        <div className="name-dialog-title">{isEdit ? 'Edit Placeholder' : 'Insert Placeholder'}</div>
        <div className="name-dialog-sub">
          {isEdit ? `Editing "${editTarget.name}"` : `At cursor (${cursorCol}, ${cursorRow})`}
        </div>
        <div className="name-dialog-label" style={{ marginBottom: 4 }}>Field name:</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          <div>
            <div className="name-dialog-label">Col:</div>
            <input className="name-dialog-width" type="number" value={col} min={0} max={31}
              onChange={e => setCol(e.target.value)} />
          </div>
          <div>
            <div className="name-dialog-label">Row:</div>
            <input className="name-dialog-width" type="number" value={row} min={0} max={7}
              onChange={e => setRow(e.target.value)} />
          </div>
          <div>
            <div className="name-dialog-label">Width:</div>
            <input className="name-dialog-width" type="number" value={width} min={1} max={20}
              onChange={e => setWidth(e.target.value)} />
          </div>
        </div>
        <div className="name-dialog-row">
          <button className="nd-btn" onClick={onClose}>Cancel</button>
          <button className="nd-btn confirm" onClick={confirm}>{isEdit ? 'Save' : 'Insert'}</button>
        </div>
      </div>
    </div>
  )
}
