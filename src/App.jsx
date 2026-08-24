import { useState, useRef } from 'react'
import { useStore } from './store'
import { DISP } from './constants'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import LcdCanvas from './components/LcdCanvas'
import FieldsPanel from './components/FieldsPanel'
import CgramPanel from './components/CgramPanel'
import CodePanel from './components/CodePanel'
import PlaceholderDialog from './components/PlaceholderDialog'
import SpecialCharPicker from './components/SpecialCharPicker'
import ArduinoGuide from './components/ArduinoGuide'
import NavPanel from './components/NavPanel'
import SimPanel from './components/SimPanel'

export default function App() {
  const { state, dispatch } = useStore()
  const { dt, activeScreen, screens, cursorCol, cursorRow, cgram } = state
  const cfg = DISP[dt]
  const screen = screens[activeScreen]

  const [phOpen, setPhOpen] = useState(false)
  const [editPh, setEditPh] = useState(null)   // { index, name, col, row, width }
  const [specOpen, setSpecOpen] = useState(false)
  const [specPos, setSpecPos] = useState({ x: 0, y: 0 })
  const [guideOpen, setGuideOpen] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const specialBtnRef = useRef(null)

  const usedCgram = cgram.filter(Boolean).length
  const fieldCount = screen.placeholders.length

  function openSpecial(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setSpecPos({ x: rect.left, y: rect.bottom + 6 })
    setSpecOpen(v => !v)
    e.stopPropagation()
  }

  function handleEditPlaceholder(i, p) {
    setEditPh({ index: i, ...p })
  }

  return (
    <div className="app">
      <Header onGuide={() => setGuideOpen(true)} />
      <div className="body">
        <Sidebar />
        <div className="editor">
          <div className="editor-tabs">
            <div className="editor-tab">Editor</div>
            <div className="editor-breadcrumb">
              <span>{screen.name}</span> · <span>{cfg.label}</span>
            </div>
          </div>
          <div className="editor-body">
            <div className="info-banner">
              <div className="info-icon">◎</div>
              <div className="info-text">
                <b style={{ color: '#7aba7a' }}>Future-edit aware</b><br />
                Click a cell and type to edit static text. Click{' '}
                <code>+ Insert Placeholder</code> to add a dynamic field — its column and
                row become permanent. Placeholders show as <code>[name]</code> tokens.
              </div>
            </div>
            <div className="editor-toolbar">
              <button className="insert-ph-btn" onClick={() => setPhOpen(true)}>
                <span className="ph-icon">+</span>
                Insert Placeholder at ({cursorCol}, {cursorRow})
              </button>
              <button ref={specialBtnRef} className="special-btn" onClick={openSpecial}>
                ⊞ Special chars
              </button>
              <button className="example-btn" onClick={() => dispatch({ type: 'LOAD_EXAMPLE' })}>
                ⚡ Load example
              </button>
              <button className="sim-launch-btn" onClick={() => setSimOpen(true)}>
                ▶ Simulate
              </button>
              <div className="toolbar-sep" />
              <span className="badge badge-outline">{dt}</span>
              <span className="badge badge-field">
                {fieldCount} field{fieldCount !== 1 ? 's' : ''}
              </span>
              <span className="badge badge-cgram">{usedCgram}/8 CGRAM</span>
            </div>
            <LcdCanvas />
          </div>
        </div>
        <div className="right-panel">
          <FieldsPanel onEdit={handleEditPlaceholder} />
          <CgramPanel />
          <NavPanel />
          <div className="panel-section">
            <div className="panel-title">
              <span className="panel-title-text">Stability</span>
            </div>
            <div className="stability-text">
              Coordinates for each field are written verbatim into the generated header.
              Editing static text <em>never</em> shifts a placeholder's column or row —
              its position is fixed at insertion time.
            </div>
          </div>
        </div>
      </div>
      <CodePanel />
      <PlaceholderDialog open={phOpen} onClose={() => setPhOpen(false)} editTarget={null} />
      <PlaceholderDialog
        open={editPh != null}
        onClose={() => setEditPh(null)}
        editTarget={editPh}
      />
      <SpecialCharPicker open={specOpen} pos={specPos} onClose={() => setSpecOpen(false)} />
      <ArduinoGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
      {simOpen && <SimPanel onClose={() => setSimOpen(false)} />}
    </div>
  )
}
