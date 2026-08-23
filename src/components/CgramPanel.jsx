import { useEffect, useRef } from 'react'
import { useStore } from '../store'

function CgramSlotCanvas({ glyph }) {
  const ref = useRef(null)
  const PX = 4
  const sz = 5 * PX + 4
  const ht = 8 * PX + 4

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0a150a'
    ctx.fillRect(0, 0, sz, ht)
    if (glyph) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 5; c++) {
          const on = (glyph[r] >> (4 - c)) & 1
          ctx.fillStyle = on ? '#4ade80' : 'rgba(74,222,128,0.06)'
          ctx.fillRect(2 + c * PX, 2 + r * PX, PX - 1, PX - 1)
        }
      }
    } else {
      ctx.fillStyle = '#1a2a1a'
      ctx.fillRect(2, 2, sz - 4, ht - 4)
    }
  }, [glyph])

  return (
    <canvas
      ref={ref}
      className="cgram-canvas"
      width={sz}
      height={ht}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export default function CgramPanel() {
  const { state, dispatch } = useStore()
  const { cgram, editingCgramSlot } = state
  const usedCount = cgram.filter(Boolean).length

  function openEditor(slot) {
    dispatch({ type: 'INIT_CGRAM', slot })
    dispatch({ type: 'SET_EDITING_CGRAM', slot })
  }

  function insertChar(slot) {
    dispatch({ type: 'SET_CELL', col: state.cursorCol, row: state.cursorRow, char: String.fromCharCode(slot) })
    dispatch({ type: 'ADVANCE_CURSOR' })
  }

  function togglePixel(row, col) {
    dispatch({ type: 'TOGGLE_CGRAM_PIXEL', slot: editingCgramSlot, row, col })
  }

  const editingGlyph = editingCgramSlot >= 0 && cgram[editingCgramSlot]
    ? cgram[editingCgramSlot]
    : Array(8).fill(0)

  return (
    <div className="panel-section">
      <div className="panel-title">
        <span className="panel-title-text">CGRAM Glyphs</span>
        <span className="panel-title-count">{usedCount}/8</span>
      </div>
      <div className="cgram-grid">
        {cgram.map((glyph, i) => (
          <div
            key={i}
            className={
              'cgram-slot' +
              (glyph ? ' used' : '') +
              (editingCgramSlot === i ? ' editing' : '')
            }
            title={glyph ? `Slot ${i} — double-click to edit` : `Slot ${i} — empty`}
            onClick={() => insertChar(i)}
            onDoubleClick={() => openEditor(i)}
          >
            <CgramSlotCanvas glyph={glyph} />
            <div className="cgram-idx">{i}</div>
          </div>
        ))}
      </div>
      <div className="cgram-hint">Double-click a slot to edit its glyph.</div>

      {editingCgramSlot >= 0 && (
        <div className="cgram-editor">
          <div className="cgram-editor-title">Editing slot {editingCgramSlot}</div>
          <div className="cgram-pixel-grid">
            {Array.from({ length: 8 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => {
                const on = (editingGlyph[r] >> (4 - c)) & 1
                return (
                  <div
                    key={`${r}-${c}`}
                    className={'cgram-px' + (on ? ' on' : '')}
                    onClick={() => togglePixel(r, c)}
                  />
                )
              })
            )}
          </div>
          <div className="cgram-editor-btns">
            <button
              className="cgram-editor-btn"
              onClick={() => dispatch({ type: 'CLEAR_CGRAM', slot: editingCgramSlot })}
            >
              Clear
            </button>
            <button
              className="cgram-editor-btn"
              onClick={() => dispatch({ type: 'SET_EDITING_CGRAM', slot: -1 })}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
