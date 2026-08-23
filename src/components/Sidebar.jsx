import { useStore } from '../store'

export default function Sidebar() {
  const { state, dispatch } = useStore()
  const { screens, activeScreen } = state

  function addScreen() {
    const n = prompt('Screen name:', 'Screen' + (screens.length + 1))
    if (n?.trim()) dispatch({ type: 'ADD_SCREEN', name: n.trim() })
  }

  function renameScreen(e, i) {
    e.stopPropagation()
    const n = prompt('Rename screen:', screens[i].name)
    if (n?.trim()) dispatch({ type: 'RENAME_SCREEN', index: i, name: n.trim() })
  }

  function deleteScreen(e, i) {
    e.stopPropagation()
    if (screens.length < 2) return alert('Must have at least one screen.')
    dispatch({ type: 'DELETE_SCREEN', index: i })
  }

  return (
    <div className="sidebar">
      <div className="sidebar-hdr">Screens</div>
      <div className="screen-list">
        {screens.map((s, i) => (
          <div
            key={i}
            className={'screen-item' + (i === activeScreen ? ' active' : '')}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SCREEN', index: i })}
          >
            <div className={'screen-icon' + (i === activeScreen ? ' active-icon' : '')} />
            <div className={'screen-name' + (i === activeScreen ? ' active-name' : '')}>
              {s.name}
            </div>
            <div className="screen-actions">
              <button className="screen-act-btn" onClick={e => renameScreen(e, i)} title="Rename">✎</button>
              <button className="screen-act-btn" onClick={e => deleteScreen(e, i)} title="Delete">⊗</button>
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="new-screen-btn" onClick={addScreen}>+ New screen</button>
      </div>
    </div>
  )
}
