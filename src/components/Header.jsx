import { useStore } from '../store'
import { DISP } from '../constants'
import { generateHeader } from '../headerGen'

const LIB_OPTIONS = [
  { value: 'liquidcrystal_i2c', label: 'LiquidCrystal_I2C' },
  { value: 'liquidcrystal',     label: 'LiquidCrystal' },
  { value: 'custom',            label: 'Custom HAL' },
]

export default function Header({ onGuide }) {
  const { state, dispatch } = useStore()
  const { dt, screens, targetLib = 'liquidcrystal_i2c', i2cAddr = '0x27' } = state

  function downloadHeader() {
    const text = generateHeader(state).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lcd_screens.h'
    a.click()
  }

  function copyHeader() {
    navigator.clipboard.writeText(generateHeader(state).join('\n')).catch(() => {})
  }

  return (
    <header className="hdr">
      <div className="hdr-logo">
        <div className="hdr-logo-badge">LCD</div>
        <div className="hdr-logo-text">Screen Builder</div>
      </div>
      <div className="hdr-sep" />
      <div className="tab-group">
        {Object.entries(DISP).map(([key, cfg]) => (
          <button
            key={key}
            className={'tab' + (dt === key ? ' active' : '')}
            onClick={() => dispatch({ type: 'SET_DT', dt: key })}
          >
            {cfg.label}
          </button>
        ))}
      </div>
      <div className="hdr-sep" />
      <span className="hdr-label">Library</span>
      <select
        className="hdr-select"
        value={targetLib}
        onChange={e => dispatch({ type: 'SET_TARGET_LIB', lib: e.target.value })}
      >
        {LIB_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {targetLib === 'liquidcrystal_i2c' && (
        <input
          className="hdr-addr-input"
          value={i2cAddr}
          onChange={e => dispatch({ type: 'SET_I2C_ADDR', addr: e.target.value })}
          placeholder="0x27"
          title="I2C address (0x27 or 0x3F are common)"
        />
      )}
      <div className="hdr-space" />
      <span className="hdr-count">
        {screens.length} screen{screens.length !== 1 ? 's' : ''}
      </span>
      <button className="hdr-btn" onClick={onGuide} title="How to use in Arduino">? Arduino Guide</button>
      <button className="hdr-btn" onClick={copyHeader}>Copy header</button>
      <button className="hdr-btn primary" onClick={downloadHeader}>↓ Download .h</button>
    </header>
  )
}
