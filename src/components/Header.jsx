import { useStore } from '../store'
import { DISP } from '../constants'
import { generateHeader } from '../headerGen'

export default function Header() {
  const { state, dispatch } = useStore()
  const { dt, screens } = state

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
      <div className="hdr-space" />
      <span className="hdr-count">
        {screens.length} screen{screens.length !== 1 ? 's' : ''}
      </span>
      <button className="hdr-btn" onClick={copyHeader}>Copy header</button>
      <button className="hdr-btn primary" onClick={downloadHeader}>↓ Download .h</button>
    </header>
  )
}
