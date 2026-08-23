import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import { DISP, CW, CH, PAD_X, PAD_Y } from '../constants'
import { drawPixelChar } from '../font'

export default function LcdCanvas({ onInsertPlaceholder, onSpecialBtn }) {
  const { state, dispatch } = useStore()
  const { dt, activeScreen, screens, cgram, cursorCol, cursorRow } = state
  const canvasRef = useRef(null)
  const specBtnRef = useRef(null)

  const screen = screens[activeScreen]
  const cfg = DISP[dt]

  function getPlaceholderAt(col, row) {
    return screen.placeholders.find(
      p => p.row === row && col >= p.col && col < p.col + p.width
    )
  }

  const renderLCD = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = cfg.cols * CW + PAD_X * 2
    const H = cfg.rows * CH + PAD_Y * 2
    const DPR = window.devicePixelRatio || 1
    canvas.width = W * DPR
    canvas.height = H * DPR
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(DPR, DPR)
    ctx.fillStyle = '#0a1a0a'
    ctx.fillRect(0, 0, W, H)

    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        const cx = PAD_X + c * CW
        const cy = PAD_Y + r * CH
        const ph = getPlaceholderAt(c, r)
        const isCursor = c === cursorCol && r === cursorRow

        if (isCursor) {
          ctx.fillStyle = '#3a9a3a'
          ctx.fillRect(cx, cy, CW - 1, CH - 1)
        } else if (ph) {
          const isStart = c === ph.col
          const isEnd = c === ph.col + ph.width - 1
          ctx.fillStyle = 'rgba(180,80,0,0.35)'
          ctx.fillRect(cx, cy, CW - 1, CH - 1)
          if (isStart) {
            ctx.fillStyle = 'rgba(220,110,0,0.5)'
            ctx.fillRect(cx, cy, 2, CH - 1)
          }
          if (isEnd) {
            ctx.fillStyle = 'rgba(220,110,0,0.5)'
            ctx.fillRect(cx + CW - 3, cy, 2, CH - 1)
          }
        }

        const charVal = screen.cells[r]?.[c] ?? ' '
        const code = charVal.charCodeAt(0)
        let onCol, offCol
        if (isCursor) {
          onCol = '#0a1a0a'; offCol = 'rgba(10,26,10,0.2)'
        } else if (ph) {
          onCol = '#fb923c'; offCol = 'rgba(180,80,0,0.08)'
        } else {
          onCol = '#4ade80'; offCol = 'rgba(74,222,128,0.06)'
        }
        drawPixelChar(ctx, code, cx, cy, onCol, offCol, cgram)

        if (ph && c === ph.col) {
          const spanW = ph.width * CW - 2
          const label = `[${ph.name}]`
          // Dark semi-transparent backing so label is readable over any char
          ctx.fillStyle = 'rgba(20,8,0,0.72)'
          ctx.fillRect(cx + 1, cy + CH - 13, spanW, 11)
          ctx.font = 'bold 9px "JetBrains Mono", monospace'
          ctx.fillStyle = '#fb923c'
          ctx.textBaseline = 'bottom'
          ctx.fillText(label, cx + 3, cy + CH - 3, spanW - 4)
          ctx.textBaseline = 'alphabetic'
        }
      }
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { renderLCD() }, [renderLCD])

  function handleClick(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor((x - PAD_X) / CW)
    const row = Math.floor((y - PAD_Y) / CH)
    if (col >= 0 && col < cfg.cols && row >= 0 && row < cfg.rows) {
      dispatch({ type: 'SET_CURSOR', col, row })
      canvas.focus()
    }
  }

  function handleKeyDown(e) {
    let handled = true
    switch (e.key) {
      case 'ArrowRight':
        dispatch({ type: 'SET_CURSOR', col: Math.min(cfg.cols - 1, cursorCol + 1), row: cursorRow }); break
      case 'ArrowLeft':
        dispatch({ type: 'SET_CURSOR', col: Math.max(0, cursorCol - 1), row: cursorRow }); break
      case 'ArrowDown':
        dispatch({ type: 'SET_CURSOR', col: cursorCol, row: Math.min(cfg.rows - 1, cursorRow + 1) }); break
      case 'ArrowUp':
        dispatch({ type: 'SET_CURSOR', col: cursorCol, row: Math.max(0, cursorRow - 1) }); break
      case 'Backspace':
        dispatch({ type: 'SET_CELL', col: cursorCol, row: cursorRow, char: ' ' })
        dispatch({ type: 'SET_CURSOR', col: Math.max(0, cursorCol - 1), row: cursorRow }); break
      case 'Delete':
        dispatch({ type: 'SET_CELL', col: cursorCol, row: cursorRow, char: ' ' }); break
      case 'Home':
        dispatch({ type: 'SET_CURSOR', col: 0, row: cursorRow }); break
      case 'End':
        dispatch({ type: 'SET_CURSOR', col: cfg.cols - 1, row: cursorRow }); break
      case 'Enter':
        dispatch({ type: 'SET_CURSOR', col: 0, row: Math.min(cfg.rows - 1, cursorRow + 1) }); break
      case 'Tab':
        e.preventDefault()
        dispatch({ type: 'SET_CURSOR', col: Math.min(cfg.cols - 1, cursorCol + 1), row: cursorRow }); break
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          dispatch({ type: 'SET_CELL', col: cursorCol, row: cursorRow, char: e.key })
          dispatch({ type: 'ADVANCE_CURSOR' })
        } else { handled = false }
    }
    if (handled) e.preventDefault()
  }

  const colMarkers = [0, 5, 10, 15, 20].filter(n => n < cfg.cols)
  const rowLabels = Array.from({ length: cfg.rows }, (_, i) => i)

  return (
    <div className="lcd-area">
      <div className="lcd-markers-row" style={{ paddingLeft: (32 + PAD_X) + 'px' }}>
        {colMarkers.map(n => (
          <div
            key={n}
            className="lcd-col-marker"
            style={{ left: n * CW + 'px' }}
          >
            {n}
          </div>
        ))}
      </div>
      <div className="lcd-main-row">
        <div className="lcd-row-labels">
          {rowLabels.map(r => (
            <div key={r} className="lcd-row-label" style={{ height: CH + 'px' }}>R{r}</div>
          ))}
        </div>
        <div className="lcd-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="lcd-canvas"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="lcd-status">
        Cursor at col <span>{cursorCol}</span>, row <span>{cursorRow}</span>
        &nbsp;·&nbsp; Type to edit &nbsp;·&nbsp; Arrow keys to move &nbsp;·&nbsp; Click any cell
      </div>
    </div>
  )
}
