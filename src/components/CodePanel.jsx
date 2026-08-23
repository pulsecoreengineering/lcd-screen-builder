import { useState } from 'react'
import { useStore } from '../store'
import { generateHeader, syntaxHL } from '../headerGen'

export default function CodePanel() {
  const { state, dispatch } = useStore()
  const { codeOpen } = state
  const [copied, setCopied] = useState(false)

  const lines = generateHeader(state)

  function copyCode() {
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function downloadCode() {
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lcd_screens.h'
    a.click()
  }

  return (
    <div className="code-panel">
      <div className="code-panel-hdr">
        <span className="code-label">
          <span className="code-label-icon">◇</span> GENERATED C HEADER
        </span>
        <span className="code-filename">lcd_screens.h</span>
        <span className="code-lines">{lines.length} lines</span>
        <div className="code-panel-space" />
        <div className="code-action-btns">
          <button className="code-act-btn" onClick={copyCode}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
          <button className="code-act-btn" onClick={downloadCode}>↓ Download</button>
        </div>
        <button
          className="code-toggle"
          onClick={() => dispatch({ type: 'TOGGLE_CODE' })}
        >
          {codeOpen ? '▲' : '▼'}
        </button>
      </div>
      {codeOpen && (
        <div className="code-body">
          {lines.map((line, i) => (
            <div
              key={i}
              className="code-line"
              dangerouslySetInnerHTML={{ __html: syntaxHL(line) || '&nbsp;' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
