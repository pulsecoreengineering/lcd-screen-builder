import { useState } from 'react'
import { useStore } from '../store'
import { DISP } from '../constants'

const KPD_3_LAYOUT = [['1','2','3'],['4','5','6'],['7','8','9'],['*','0','#']]
const KPD_4_LAYOUT = [['1','2','3','A'],['4','5','6','B'],['7','8','9','C'],['*','0','#','D']]
const KPD_ROLE     = { '2':'▲','8':'▼','#':'✓','*':'↩','A':'▲','B':'▼','C':'✓','D':'↩' }
const KPD_NAV_MAP3 = { '2':'up','8':'down','#':'select','*':'back' }
const KPD_NAV_MAP4 = { 'A':'up','B':'down','C':'select','D':'back','2':'up','8':'down','#':'select','*':'back' }

// ── LCD display ──────────────────────────────────────────────────────────────
function SimLcd({ screen, cfg, spValues, editScreen, editField, kpdBuffer, isKeypad, curScreen, onFieldClick }) {
  const editPhs = screen.placeholders.filter(p => p.editable)

  return (
    <div className="sim-lcd">
      {Array.from({ length: cfg.rows }, (_, r) => (
        <div key={r} className="sim-lcd-row">
          {Array.from({ length: cfg.cols }, (_, c) => {
            const rawCh  = screen.cells[r]?.[c] ?? ' '
            const code   = rawCh.charCodeAt(0)
            const ph     = screen.placeholders.find(p => p.row === r && c >= p.col && c < p.col + p.width)
            const offset = ph ? c - ph.col : 0

            if (ph) {
              if (ph.editable) {
                const li       = editPhs.indexOf(ph)
                const key      = `${curScreen}-${li}`
                const isEditing= editScreen === curScreen && editField === li
                let display, cls

                if (isEditing) {
                  cls     = 'sim-cell sim-cell-editing'
                  display = isKeypad
                    ? (kpdBuffer[offset] ?? '_')
                    : (String(spValues[key] ?? 0).padStart(ph.width)[offset] ?? ' ')
                } else {
                  cls     = 'sim-cell sim-cell-sp'
                  display = String(spValues[key] ?? 0).padStart(ph.width)[offset] ?? ' '
                }
                return (
                  <span key={c} className={cls}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onFieldClick(curScreen, li)}>
                    {display === ' ' ? ' ' : display}
                  </span>
                )
              } else {
                // display-only placeholder: show · to indicate dynamic content
                return <span key={c} className="sim-cell sim-cell-ph">·</span>
              }
            }

            // CGRAM custom char
            if (code >= 0 && code <= 7) {
              return <span key={c} className="sim-cell sim-cell-cgram">▪</span>
            }

            return (
              <span key={c} className="sim-cell">
                {rawCh === ' ' ? ' ' : rawCh}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Input controls ────────────────────────────────────────────────────────────
function DPad({ onEvent }) {
  return (
    <div className="sim-dpad">
      <div className="sim-dpad-top">
        <button className="sim-dpad-btn" onClick={() => onEvent('up')}>▲</button>
      </div>
      <div className="sim-dpad-mid">
        <button className="sim-dpad-btn" onClick={() => onEvent('back')}>↩</button>
        <div className="sim-dpad-center" />
        <button className="sim-dpad-btn ok" onClick={() => onEvent('select')}>✓</button>
      </div>
      <div className="sim-dpad-bot">
        <button className="sim-dpad-btn" onClick={() => onEvent('down')}>▼</button>
      </div>
    </div>
  )
}

function TwoBtn({ onEvent }) {
  return (
    <div className="sim-row-btns">
      <button className="sim-nav-btn" onClick={() => onEvent('next')}>Next ▶</button>
      <button className="sim-nav-btn ok" onClick={() => onEvent('select')}>Select ✓</button>
    </div>
  )
}

function Rotary({ onEvent }) {
  return (
    <div className="sim-row-btns">
      <button className="sim-nav-btn" onClick={() => onEvent('ccw')}>◀ CCW</button>
      <button className="sim-nav-btn ok" onClick={() => onEvent('press')}>● Press</button>
      <button className="sim-nav-btn" onClick={() => onEvent('cw')}>CW ▶</button>
    </div>
  )
}

function Keypad({ layout, onKey }) {
  return (
    <div className="sim-keypad">
      {layout.map((row, ri) => (
        <div key={ri} className="sim-kpd-row">
          {row.map(k => (
            <button key={k} className={`sim-kpd-key${KPD_ROLE[k] ? ' nav' : ''}`} onClick={() => onKey(k)}>
              <span className="sim-kpd-char">{k}</span>
              {KPD_ROLE[k] && <span className="sim-kpd-role">{KPD_ROLE[k]}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function NoInput({ curScreen, total, onChange }) {
  return (
    <div className="sim-row-btns">
      <button className="sim-nav-btn" disabled={curScreen === 0} onClick={() => onChange(curScreen - 1)}>← Prev</button>
      <button className="sim-nav-btn" disabled={curScreen === total - 1} onClick={() => onChange(curScreen + 1)}>Next →</button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SimPanel({ onClose }) {
  const { state } = useStore()
  const { screens, transitions, inputMethod } = state
  const cfg       = DISP[state.dt] || DISP['16x2']
  const isKeypad  = inputMethod === '4x3kpd' || inputMethod === '4x4kpd'

  const [curScreen,  setCurScreen]  = useState(state.activeScreen)
  const [editScreen, setEditScreen] = useState(-1)
  const [editField,  setEditField]  = useState(-1)
  const [kpdBuffer,  setKpdBuffer]  = useState('')
  const [log,        setLog]        = useState(['Ready — press buttons or click fields to navigate.'])

  const [spValues, setSpValues] = useState(() => {
    const vals = {}
    screens.forEach((s, si) => {
      s.placeholders.filter(p => p.editable).forEach((p, li) => {
        vals[`${si}-${li}`] = p.spDefault ?? 0
      })
    })
    return vals
  })

  function pushLog(msg) { setLog(prev => [...prev.slice(-7), msg]) }

  function editPhs(si) { return screens[si]?.placeholders.filter(p => p.editable) || [] }

  function enterEdit(si, li) {
    const ph = editPhs(si)[li]
    if (!ph) return
    setEditScreen(si); setEditField(li); setKpdBuffer('')
    pushLog(`✎ Edit: ${screens[si].name}.${ph.name}  [${ph.spMin ?? 0}–${ph.spMax ?? 100}]`)
  }

  function exitEdit(reason = 'confirmed') {
    setEditScreen(-1); setEditField(-1); setKpdBuffer('')
    pushLog(`✓ Edit ${reason}`)
  }

  function adjustSp(delta) {
    const key = `${editScreen}-${editField}`
    const ph  = editPhs(editScreen)[editField]
    if (!ph) return
    const cur  = spValues[key] ?? ph.spDefault ?? 0
    const next = Math.min(ph.spMax ?? 100, Math.max(ph.spMin ?? 0, cur + delta * (ph.spStep ?? 1)))
    setSpValues(v => ({ ...v, [key]: next }))
    pushLog(`  ${ph.name} = ${next}`)
  }

  function confirmKpd() {
    if (!kpdBuffer) { exitEdit('cancelled'); return }
    const key = `${editScreen}-${editField}`
    const ph  = editPhs(editScreen)[editField]
    if (!ph) { exitEdit('cancelled'); return }
    let val = parseInt(kpdBuffer, 10)
    if (isNaN(val)) val = ph.spDefault ?? 0
    val = Math.min(ph.spMax ?? 100, Math.max(ph.spMin ?? 0, val))
    setSpValues(v => ({ ...v, [key]: val }))
    pushLog(`  ${ph.name} = ${val}  (confirmed)`)
    setEditScreen(-1); setEditField(-1); setKpdBuffer('')
  }

  function navTo(si) {
    setCurScreen(si); setEditScreen(-1); setEditField(-1); setKpdBuffer('')
    pushLog(`→ ${screens[si]?.name}`)
  }

  function fireNavEvent(eventName) {
    // Edit mode — non-keypad
    if (editField !== -1 && !isKeypad) {
      if (['up','next','cw'].includes(eventName))     { adjustSp(+1); return }
      if (['down','ccw'].includes(eventName))          { adjustSp(-1); return }
      if (['select','press','back'].includes(eventName)) { exitEdit(); return }
      return
    }

    // Find transition
    const t = transitions.find(t => t.from === curScreen && t.event === eventName)
    if (t) { navTo(t.to); return }

    // Select/press on a settings screen with editable fields → enter first field edit
    if (['select','press'].includes(eventName)) {
      const phs = editPhs(curScreen)
      if (phs.length > 0) { enterEdit(curScreen, 0); return }
    }

    pushLog(`  [no transition: "${eventName}" from ${screens[curScreen]?.name}]`)
  }

  function fireKeypadKey(key) {
    if (editField !== -1) {
      if (key >= '0' && key <= '9') {
        const ph = editPhs(editScreen)[editField]
        if (kpdBuffer.length < (ph?.width ?? 6)) {
          const next = kpdBuffer + key
          setKpdBuffer(next)
          pushLog(`  buffer: ${next}`)
        }
        return
      }
      if (key === '*') {
        if (kpdBuffer.length > 0) setKpdBuffer(prev => { const n = prev.slice(0,-1); pushLog(`  buffer: ${n||'(empty)'}`); return n })
        else exitEdit('cancelled')
        return
      }
      if (['#','C','D'].includes(key)) { confirmKpd(); return }
      if (key === 'A') { adjustSp(+1); return }
      if (key === 'B') { adjustSp(-1); return }
      return
    }

    const map  = inputMethod === '4x4kpd' ? KPD_NAV_MAP4 : KPD_NAV_MAP3
    const evName = map[key]
    if (evName) fireNavEvent(evName)
    else pushLog(`  [key "${key}" — no nav binding]`)
  }

  function handleFieldClick(si, li) {
    if (si !== curScreen) return
    if (editScreen === si && editField === li) exitEdit()
    else enterEdit(si, li)
  }

  const screen       = screens[curScreen]
  const curEditPh    = editField !== -1 ? editPhs(editScreen)[editField] : null
  const allEditFields = screens.flatMap((s, si) =>
    s.placeholders.filter(p => p.editable).map((p, li) => ({ s, si, p, li, key: `${si}-${li}` }))
  )

  return (
    <div className="guide-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sim-modal">

        {/* Header */}
        <div className="guide-header">
          <div className="guide-title">
            <span className="guide-title-badge">▶</span>
            Navigation Simulator
            <span className="sim-method-badge">{inputMethod === 'none' ? 'No input' : inputMethod}</span>
          </div>
          <button className="guide-close" onClick={onClose}>✕</button>
        </div>

        <div className="sim-body">

          {/* ── Left: LCD + input controls ── */}
          <div className="sim-left">

            {/* Screen tabs */}
            <div className="sim-screen-tabs">
              {screens.map((s, i) => (
                <button key={i}
                  className={`sim-screen-tab${i === curScreen ? ' active' : ''}${s.type === 'settings' ? ' settings' : ''}`}
                  onClick={() => navTo(i)}>
                  {s.name}
                </button>
              ))}
            </div>

            {/* LCD */}
            <SimLcd
              screen={screen} cfg={cfg} spValues={spValues}
              editScreen={editScreen} editField={editField}
              kpdBuffer={kpdBuffer} isKeypad={isKeypad}
              curScreen={curScreen} onFieldClick={handleFieldClick}
            />

            <div className="sim-lcd-caption">
              <span>{screen.name}</span>
              <span className={`sim-type-tag ${screen.type}`}>{screen.type}</span>
              {curEditPh && (
                <span className="sim-edit-hint"> · editing <b>{curEditPh.name}</b>
                  {isKeypad ? ' — type value · # confirm · * backspace' : ' — ▲▼ adjust · ✓ confirm'}
                </span>
              )}
            </div>

            {/* Input controls */}
            <div className="sim-controls">
              {inputMethod === '4btn'   && <DPad    onEvent={fireNavEvent} />}
              {inputMethod === '2btn'   && <TwoBtn  onEvent={fireNavEvent} />}
              {inputMethod === 'rotary' && <Rotary  onEvent={fireNavEvent} />}
              {inputMethod === '4x3kpd' && <Keypad  layout={KPD_3_LAYOUT} onKey={fireKeypadKey} />}
              {inputMethod === '4x4kpd' && <Keypad  layout={KPD_4_LAYOUT} onKey={fireKeypadKey} />}
              {inputMethod === 'none'   && <NoInput curScreen={curScreen} total={screens.length} onChange={navTo} />}
            </div>

            {/* Click-to-edit hint for editable fields */}
            {editPhs(curScreen).length > 0 && editField === -1 && (
              <div className="sim-click-hint">Click a highlighted value to edit it</div>
            )}
          </div>

          {/* ── Right: transitions + log + sp values ── */}
          <div className="sim-right">

            <div className="sim-section-label">Transitions</div>
            {transitions.length === 0 ? (
              <div className="sim-empty">No transitions defined yet</div>
            ) : (
              <div className="sim-trans-list">
                {transitions.map((t, i) => (
                  <div key={i}
                    className={`sim-trans-row${t.from === curScreen ? ' from-active' : ''}${t.to === curScreen ? ' to-active' : ''}`}>
                    <span className="sim-trans-name">{screens[t.from]?.name}</span>
                    <span className="sim-trans-ev">{t.event}</span>
                    <span className="sim-trans-arrow">→</span>
                    <span className="sim-trans-name">{screens[t.to]?.name}</span>
                  </div>
                ))}
              </div>
            )}

            {allEditFields.length > 0 && (
              <>
                <div className="sim-section-label" style={{ marginTop: 12 }}>Setpoint Values</div>
                <div className="sim-sp-list">
                  {allEditFields.map(({ s, si, p, li, key }) => {
                    const active = editScreen === si && editField === li
                    return (
                      <div key={key} className={`sim-sp-row${active ? ' editing' : ''}`}>
                        <span className="sim-sp-name">{s.name}.<b>{p.name}</b></span>
                        <span className="sim-sp-val">{spValues[key] ?? p.spDefault ?? 0}</span>
                        <span className="sim-sp-range">[{p.spMin ?? 0}–{p.spMax ?? 100}]</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="sim-section-label" style={{ marginTop: 12 }}>Event Log</div>
            <div className="sim-log">
              {log.map((l, i) => <div key={i} className="sim-log-entry">{l}</div>)}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
