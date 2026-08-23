import { useState } from 'react'
import { useStore } from '../store'

const INPUT_METHODS = [
  { value: 'none',    label: 'None' },
  { value: '2btn',   label: '2-Button (Next/Select)' },
  { value: '4btn',   label: '4-Button (Up/Down/Select/Back)' },
  { value: 'rotary', label: 'Rotary Encoder' },
]

const EVENTS_BY_METHOD = {
  none:    [],
  '2btn':  ['next', 'select'],
  '4btn':  ['up', 'down', 'select', 'back'],
  rotary:  ['cw', 'ccw', 'press'],
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
  rotary:  [
    { key: 'clk', label: 'CLK pin' },
    { key: 'dt',  label: 'DT pin' },
    { key: 'sw',  label: 'SW pin' },
  ],
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

  return (
    <div className="panel-section">
      <div className="panel-title">
        <span className="panel-title-text">Navigation</span>
      </div>

      <div className="nav-row">
        <span className="nav-label">Input</span>
        <select
          className="nav-select"
          value={inputMethod}
          onChange={e => dispatch({ type: 'SET_INPUT_METHOD', method: e.target.value })}
        >
          {INPUT_METHODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {pinFields.length > 0 && (
        <div className="nav-pins">
          {pinFields.map(f => (
            <div className="nav-row" key={f.key}>
              <span className="nav-label">{f.label}</span>
              <input
                className="nav-pin-input"
                type="number"
                min={0}
                max={53}
                value={navPins[f.key] ?? 2}
                onChange={e => dispatch({ type: 'SET_NAV_PIN', pin: f.key, value: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      )}

      {inputMethod !== 'none' && (
        <>
          <div className="nav-section-label">Transitions</div>
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
                  <button
                    className="nav-del-btn"
                    onClick={() => dispatch({ type: 'REMOVE_TRANSITION', index: i })}
                    title="Remove"
                  >✕</button>
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
        <div className="nav-hint">Select an input method above to define screen transitions.</div>
      )}
    </div>
  )
}
