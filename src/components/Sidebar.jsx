import { useStore } from '../store'

function ScreenItem({ s, i, isActive, dispatch }) {
  function rename(e) {
    e.stopPropagation()
    const n = prompt('Rename screen:', s.name)
    if (n?.trim()) dispatch({ type: 'RENAME_SCREEN', index: i, name: n.trim() })
  }
  function remove(e) {
    e.stopPropagation()
    dispatch({ type: 'DELETE_SCREEN', index: i })
  }
  function toggleType(e) {
    e.stopPropagation()
    dispatch({ type: 'SET_SCREEN_TYPE', index: i, screenType: s.type === 'settings' ? 'main' : 'settings' })
  }

  return (
    <div
      className={'screen-item' + (isActive ? ' active' : '')}
      onClick={() => dispatch({ type: 'SET_ACTIVE_SCREEN', index: i })}
    >
      <div className={`screen-icon${isActive ? ' active-icon' : ''}${s.type === 'settings' ? ' settings-icon' : ''}`} />
      <div className={'screen-name' + (isActive ? ' active-name' : '')}>{s.name}</div>
      <div className="screen-actions">
        <button className="screen-act-btn" onClick={toggleType}
          title={s.type === 'settings' ? 'Switch to Main' : 'Switch to Settings'}>
          {s.type === 'settings' ? 'M' : 'S'}
        </button>
        <button className="screen-act-btn" onClick={rename} title="Rename">✎</button>
        <button className="screen-act-btn" onClick={remove} title="Delete">⊗</button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { state, dispatch } = useStore()
  const { screens, activeScreen } = state

  function addScreen(type) {
    const label = type === 'settings' ? 'Settings' : 'Screen'
    const n = prompt(`${label} name:`, `${label}${screens.length + 1}`)
    if (n?.trim()) dispatch({ type: 'ADD_SCREEN', name: n.trim(), screenType: type })
  }

  const mainScreens     = screens.map((s, i) => ({ s, i })).filter(({ s }) => s.type !== 'settings')
  const settingsScreens = screens.map((s, i) => ({ s, i })).filter(({ s }) => s.type === 'settings')

  return (
    <div className="sidebar">
      <div className="screen-list">

        <div className="sidebar-group-hdr">
          <span>Main</span>
          <button className="sidebar-group-add" onClick={() => addScreen('main')} title="Add main screen">+</button>
        </div>
        {mainScreens.length === 0 && (
          <div className="sidebar-empty">No main screens</div>
        )}
        {mainScreens.map(({ s, i }) => (
          <ScreenItem key={i} s={s} i={i} isActive={i === activeScreen} dispatch={dispatch} />
        ))}

        <div className="sidebar-group-hdr" style={{ marginTop: 10 }}>
          <span>Settings</span>
          <button className="sidebar-group-add" onClick={() => addScreen('settings')} title="Add settings screen">+</button>
        </div>
        {settingsScreens.length === 0 && (
          <div className="sidebar-empty">No settings screens</div>
        )}
        {settingsScreens.map(({ s, i }) => (
          <ScreenItem key={i} s={s} i={i} isActive={i === activeScreen} dispatch={dispatch} />
        ))}

      </div>
    </div>
  )
}
