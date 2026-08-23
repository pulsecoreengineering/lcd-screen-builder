import { useState } from 'react'
import { useStore } from '../store'

const INPUT_METHODS = [
  { value: 'none',    label: 'None' },
  { value: '2btn',   label: '2-Button' },
  { value: '4btn',   label: '4-Button' },
  { value: 'rotary', label: 'Rotary Encoder' },
  { value: '4x3kpd', label: '4×3 Keypad (12-key)' },
  { value: '4x4kpd', label: '4×4 Keypad (16-key)' },
]

const EVENTS_BY_METHOD = {
  none:    [],
  '2btn':  ['next', 'select'],
  '4btn':  ['up', 'down', 'select', 'back'],
  rotary:  ['cw', 'ccw', 'press'],
  '4x3kpd': ['up', 'down', 'select', 'back'],
  '4x4kpd': ['up', 'down', 'select', 'back'],
}

const PIN_FIELDS_BY_METHOD = {
  none:    [],
  '2btn':  [{ key: 'up', label: 'Next pin' }, { key: 'select', label: 'Select pin' }],
  '4btn':  [
    { key: 'up',     label: 'Up pin' },
    { key: 'down',   label: 'Down pin' },
    { key: 'select', label: 'Select pin' },
    { key: 'back',   label: 'Back pin' },
  ],
  rotary: [
    { key: 'clk', label: 'CLK pin' },
    { key: 'dt',  label: 'DT pin' },
    { key: 'sw',  label: 'SW pin' },
  ],
  '4x3kpd': [
    { key: 'kpdR0', label: 'Row 0' }, { key: 'kpdR1', label: 'Row 1' },
    { key: 'kpdR2', label: 'Row 2' }, { key: 'kpdR3', label: 'Row 3' },
    { key: 'kpdC0', label: 'Col 0' }, { key: 'kpdC1', label: 'Col 1' },
    { key: 'kpdC2', label: 'Col 2' },
  ],
  '4x4kpd': [
    { key: 'kpdR0', label: 'Row 0' }, { key: 'kpdR1', label: 'Row 1' },
    { key: 'kpdR2', label: 'Row 2' }, { key: 'kpdR3', label: 'Row 3' },
    { key: 'kpdC0', label: 'Col 0' }, { key: 'kpdC1', label: 'Col 1' },
    { key: 'kpdC2', label: 'Col 2' }, { key: 'kpdC3', label: 'Col 3' },
  ],
}

const KPD_3x4_LAYOUT = [
  [{ k:'1' },{ k:'2', role:'up' },{ k:'3' }],
  [{ k:'4' },{ k:'5' },         { k:'6' }],
  [{ k:'7' },{ k:'8', role:'dn' },{ k:'9' }],
  [{ k:'*', role:'bk' },{ k:'0' },{ k:'#', role:'ok' }],
]
const KPD_4x4_LAYOUT = [
  [{ k:'1' },{ k:'2' },{ k:'3' },{ k:'A', role:'up' }],
  [{ k:'4' },{ k:'5' },{ k:'6' },{ k:'B', role:'dn' }],
  [{ k:'7' },{ k:'8' },{ k:'9' },{ k:'C', role:'ok' }],
  [{ k:'*' },{ k:'0' },{ k:'#' },{ k:'D', role:'bk' }],
]
const ROLE_LABEL = { up:'▲', dn:'▼', ok:'✓', bk:'↩' }

function KeypadDiagram({ layout }) {
  return (
    <div className="kpd-diagram">
      {layout.map((row, ri) => (
        <div key={ri} className="kpd-row">
          {row.map((cell, ci) => (
            <div key={ci} className={`kpd-key${cell.role ? ' kpd-key-role' : ''}`}>
              {cell.k}
              {cell.role && <span className="kpd-role">{ROLE_LABEL[cell.role]}</span>}
            </div>
          ))}
        </div>
      ))}
      <div className="kpd-hint">In edit: digits to type value · # or D to confirm · * to backspace</div>
    </div>
  )
}

function PinGrid({ pinFields, navPins, dispatch }) {
  const isKeypad = pinFields.some(f => f.key.startsWith('kpd'))
  const rowFields = isKeypad ? pinFields.slice(0, 4) : null
  const colFields = isKeypad ? pinFields.slice(4)   : null

  if (!isKeypad) {
    return (
      <div className="nav-pins">
        {pinFields.map(f => (
          <div className="nav-row" key={f.key}>
            <span className="nav-label">{f.label}</span>
            <input className="nav-pin-input" type="number" min={0} max={53}
              value={navPins[f.key] ?? 2}
              onChange={e => dispatch({ type: 'SET_NAV_PIN', pin: f.key, value: Number(e.target.value) })} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="nav-pins">
      <div className="kpd-pin-group-label">Rows (output)</div>
      <div className="kpd-pin-row">
        {rowFields.map(f => (
          <div className="kpd-pin-cell" key={f.key}>
            <div className="kpd-pin-label">{f.label}</div>
            <input className="nav-pin-input" type="number" min={0} max={53}
              value={navPins[f.key] ?? 2}
              onChange={e => dispatch({ type: 'SET_NAV_PIN', pin: f.key, value: Number(e.target.value) })} />
          </div>
        ))}
      </div>
      <div className="kpd-pin-group-label" style={{ marginTop: 6 }}>Columns (input)</div>
      <div className="kpd-pin-row">
        {colFields.map(f => (
          <div className="kpd-pin-cell" key={f.key}>
            <div className="kpd-pin-label">{f.label}</div>
            <input className="nav-pin-input" type="number" min={0} max={53}
              value={navPins[f.key] ?? 6}
              onChange={e => dispatch({ type: 'SET_NAV_PIN', pin: f.key, value: Number(e.target.value) })} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AddTransitionRow({ screens, events, onAdd }) {
  const [from, setFrom]   = useState(0)
  const [event, setEvent] = useState(events[0] || '')
  const [to, setTo]       = useState(0)

  function submit() {
    if (event) onAdd(Number(from), event, Number(to))
  }

  return (
    <div className="nav-add-row">
      <select className="nav-mini-select" value={from} onChange={e => setFrom(e.target.value)}>
        {screens.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
      </select>
      <span className="nav-arrow">→</span>
      <select className="nav-mini-select" value={event} onChange={e => setEvent(e.target.value)}>
        {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
      </select>
      <span className="nav-arrow">→</span>
      <select className="nav-mini-select" value={to} onChange={e => setTo(e.target.value)}>
        {screens.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
      </select>
      <button className="nav-add-btn" onClick={submit}>+</button>
    </div>
  )
}

export default function NavPanel() {
  const { state, dispatch } = useStore()
  const { inputMethod, navPins, transitions, screens } = state

  const events    = EVENTS_BY_METHOD[inputMethod] || []
  const pinFields = PIN_FIELDS_BY_METHOD[inputMethod] || []
  const isKeypad  = inputMethod === '4x3kpd' || inputMethod === '4x4kpd'

  return (
    <div className="panel-section">
      <div className="panel-title">
        <span className="panel-title-text">Navigation</span>
      </div>

      <div className="nav-row">
        <span className="nav-label">Input</span>
        <select className="nav-select" value={inputMethod}
          onChange={e => dispatch({ type: 'SET_INPUT_METHOD', method: e.target.value })}>
          {INPUT_METHODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {pinFields.length > 0 && (
        <PinGrid pinFields={pinFields} navPins={navPins} dispatch={dispatch} />
      )}

      {isKeypad && (
        <KeypadDiagram layout={inputMethod === '4x3kpd' ? KPD_3x4_LAYOUT : KPD_4x4_LAYOUT} />
      )}

      {inputMethod !== 'none' && (
        <>
          <div className="nav-section-label">Screen Transitions</div>
          {transitions.length > 0 && (
            <div className="nav-table">
              <div className="nav-th-row">
                <span className="nav-th">From</span>
                <span className="nav-th">Event</span>
                <span className="nav-th">To</span>
                <span className="nav-th" />
              </div>
              {transitions.map((t, i) => (
                <div className="nav-tr" key={i}>
                  <span className="nav-td">{screens[t.from]?.name ?? `#${t.from}`}</span>
                  <span className="nav-td nav-event">{t.event}</span>
                  <span className="nav-td">{screens[t.to]?.name ?? `#${t.to}`}</span>
                  <button className="nav-del-btn"
                    onClick={() => dispatch({ type: 'REMOVE_TRANSITION', index: i })}
                    title="Remove">✕</button>
                </div>
              ))}
            </div>
          )}
          <AddTransitionRow screens={screens} events={events} onAdd={(from, event, to) =>
            dispatch({ type: 'ADD_TRANSITION', from, event, to })
          } />
        </>
      )}

      {inputMethod === 'none' && (
        <div className="nav-hint">Select an input method above to define navigation.</div>
      )}
    </div>
  )
}
