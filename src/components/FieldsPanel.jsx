import { useStore } from '../store'

export default function FieldsPanel({ onEdit }) {
  const { state, dispatch } = useStore()
  const screen = state.screens[state.activeScreen]
  const phs = screen.placeholders

  return (
    <div className="panel-section">
      <div className="panel-title">
        <span className="panel-title-text">Dynamic Fields</span>
        <span className="panel-title-count">{phs.length}</span>
      </div>
      {phs.length === 0 ? (
        <div className="no-fields">No placeholders yet</div>
      ) : (
        phs.map((p, i) => (
          <div key={i} className="field-item">
            <div className="field-dot" />
            <div className="field-info">
              <div className="field-name">
                {p.name}
                {p.editable && <span className="field-sp-badge">SP</span>}
              </div>
              <div className="field-meta">
                col {p.col} · row {p.row} · w {p.width}
                {p.editable && ` · ${p.spMin ?? 0}–${p.spMax ?? 100} step ${p.spStep ?? 1}`}
              </div>
            </div>
            <button
              className="field-act-btn"
              title="Edit"
              onClick={() => onEdit(i, p)}
            >
              ✎
            </button>
            <button
              className="field-del"
              title="Remove"
              onClick={() => dispatch({ type: 'REMOVE_PLACEHOLDER', index: i })}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  )
}
