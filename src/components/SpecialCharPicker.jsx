import { useEffect } from 'react'
import { useStore } from '../store'
import { SPEC_CHARS } from '../constants'

export default function SpecialCharPicker({ open, pos, onClose }) {
  const { state, dispatch } = useStore()
  const { cursorCol, cursorRow } = state

  useEffect(() => {
    if (!open) return
    function handler() { onClose() }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open, onClose])

  if (!open) return null

  function insertChar(ch) {
    dispatch({ type: 'SET_CELL', col: cursorCol, row: cursorRow, char: ch })
    dispatch({ type: 'ADVANCE_CURSOR' })
    onClose()
  }

  return (
    <>
      <div className="spec-picker-overlay" onClick={onClose} />
      <div
        className="spec-picker"
        style={{ top: pos.y + 'px', left: pos.x + 'px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="spec-picker-title">Special Characters</div>
        <div className="spec-chars">
          {SPEC_CHARS.split('').map(ch => (
            <div
              key={ch}
              className="spec-char"
              title={'U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
              onClick={() => insertChar(ch)}
            >
              {ch}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
