import { createContext, useContext, useReducer } from 'react';
import { DISP } from './constants';

function makeScreen(name, cols, rows, type = 'main') {
  return {
    name,
    type,
    cells: Array.from({ length: rows }, () => Array(cols).fill(' ')),
    placeholders: [],
  };
}

function buildInitialState() {
  const s = makeScreen('HomeScreen', 16, 2);
  'temp: '.split('').forEach((c, i) => (s.cells[0][i] = c));
  s.cells[0][14] = '\x00';
  s.cells[0][15] = 'C';
  'Hum:  '.split('').forEach((c, i) => (s.cells[1][i] = c));
  s.cells[1][15] = '%';
  s.placeholders.push({ name: 'temp', col: 6, row: 0, width: 4 });
  s.placeholders.push({ name: 'hum',  col: 6, row: 1, width: 4 });

  const cgram = Array(8).fill(null);
  cgram[0] = [0x0e, 0x11, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00];
  cgram[1] = [0x04, 0x0e, 0x1f, 0x1f, 0x1f, 0x0e, 0x00, 0x00];

  return {
    dt: '16x2',
    activeScreen: 0,
    screens: [s],
    cgram,
    cursorCol: 0,
    cursorRow: 0,
    editingCgramSlot: -1,
    codeOpen: true,
    targetLib: 'liquidcrystal_i2c',
    i2cAddr: '0x27',
    inputMethod: 'none',
    navPins: {
        up: 2, down: 3, select: 4, back: 5,
        clk: 2, dt: 3, sw: 4,
        kpdR0: 2, kpdR1: 3, kpdR2: 4, kpdR3: 5,
        kpdC0: 6, kpdC1: 7, kpdC2: 8, kpdC3: 9,
      },
    transitions: [],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DT': {
      const cfg = DISP[action.dt];
      const screens = state.screens.map(s => ({
        ...s,
        cells: Array.from({ length: cfg.rows }, (_, r) => {
          const row = s.cells[r] || [];
          return Array.from({ length: cfg.cols }, (_, c) => row[c] ?? ' ');
        }),
      }));
      return {
        ...state,
        dt: action.dt,
        screens,
        cursorCol: Math.min(state.cursorCol, cfg.cols - 1),
        cursorRow: Math.min(state.cursorRow, cfg.rows - 1),
      };
    }

    case 'SET_CURSOR':
      return { ...state, cursorCol: action.col, cursorRow: action.row };

    case 'SET_ACTIVE_SCREEN':
      return { ...state, activeScreen: action.index, cursorCol: 0, cursorRow: 0 };

    case 'ADD_SCREEN': {
      const cfg = DISP[state.dt];
      return {
        ...state,
        screens: [...state.screens, makeScreen(action.name, cfg.cols, cfg.rows, action.screenType || 'main')],
        activeScreen: state.screens.length,
        cursorCol: 0,
        cursorRow: 0,
      };
    }

    case 'DELETE_SCREEN': {
      if (state.screens.length <= 1) return state;
      const screens = state.screens.filter((_, i) => i !== action.index);
      return {
        ...state,
        screens,
        activeScreen: Math.min(state.activeScreen, screens.length - 1),
        cursorCol: 0,
        cursorRow: 0,
      };
    }

    case 'RENAME_SCREEN':
      return {
        ...state,
        screens: state.screens.map((s, i) =>
          i === action.index ? { ...s, name: action.name } : s
        ),
      };

    case 'SET_SCREEN_TYPE':
      return {
        ...state,
        screens: state.screens.map((s, i) =>
          i === action.index ? { ...s, type: action.screenType } : s
        ),
      };

    case 'SET_CELL':
      return {
        ...state,
        screens: state.screens.map((s, si) => {
          if (si !== state.activeScreen) return s;
          return {
            ...s,
            cells: s.cells.map((row, ri) =>
              ri !== action.row
                ? row
                : row.map((c, ci) => (ci === action.col ? action.char : c))
            ),
          };
        }),
      };

    case 'ADVANCE_CURSOR': {
      const cfg = DISP[state.dt];
      return { ...state, cursorCol: Math.min(cfg.cols - 1, state.cursorCol + 1) };
    }

    case 'ADD_PLACEHOLDER':
      return {
        ...state,
        screens: state.screens.map((s, si) => {
          if (si !== state.activeScreen) return s;
          const placeholders = s.placeholders.filter(
            p =>
              !(
                p.row === action.row &&
                p.col + p.width > action.col &&
                p.col < action.col + action.width
              )
          );
          return {
            ...s,
            placeholders: [
              ...placeholders,
              { name: action.name, col: action.col, row: action.row, width: action.width },
            ],
          };
        }),
      };

    case 'REMOVE_PLACEHOLDER':
      return {
        ...state,
        screens: state.screens.map((s, si) => {
          if (si !== state.activeScreen) return s;
          return { ...s, placeholders: s.placeholders.filter((_, i) => i !== action.index) };
        }),
      };

    case 'EDIT_PLACEHOLDER':
      return {
        ...state,
        screens: state.screens.map((s, si) => {
          if (si !== state.activeScreen) return s;
          return {
            ...s,
            placeholders: s.placeholders.map((p, i) =>
              i === action.index ? { ...p, ...action.changes } : p
            ),
          };
        }),
      };

    case 'TOGGLE_CGRAM_PIXEL': {
      const cgram = state.cgram.map((g, i) => {
        if (i !== action.slot) return g;
        const glyph = g ? [...g] : Array(8).fill(0);
        glyph[action.row] = glyph[action.row] ^ (1 << (4 - action.col));
        return glyph;
      });
      return { ...state, cgram };
    }

    case 'CLEAR_CGRAM':
      return {
        ...state,
        cgram: state.cgram.map((g, i) => (i === action.slot ? Array(8).fill(0) : g)),
      };

    case 'INIT_CGRAM': {
      const cgram = state.cgram.map((g, i) =>
        i === action.slot && !g ? Array(8).fill(0) : g
      );
      return { ...state, cgram };
    }

    case 'SET_EDITING_CGRAM':
      return { ...state, editingCgramSlot: action.slot };

    case 'TOGGLE_CODE':
      return { ...state, codeOpen: !state.codeOpen };

    case 'SET_TARGET_LIB':
      return { ...state, targetLib: action.lib };

    case 'SET_I2C_ADDR':
      return { ...state, i2cAddr: action.addr };

    case 'SET_INPUT_METHOD':
      return { ...state, inputMethod: action.method };

    case 'SET_NAV_PIN':
      return { ...state, navPins: { ...state.navPins, [action.pin]: action.value } };

    case 'ADD_TRANSITION': {
      const exists = state.transitions.some(
        t => t.from === action.from && t.event === action.event
      );
      if (exists) return state;
      return { ...state, transitions: [...state.transitions, { from: action.from, event: action.event, to: action.to }] };
    }

    case 'REMOVE_TRANSITION':
      return { ...state, transitions: state.transitions.filter((_, i) => i !== action.index) };

    case 'LOAD_EXAMPLE': {
      const cols = 16, rows = 2;

      // Screen 0: Home (main) — shows live temp + current setpoint
      // Row 0: "Temp:   [temp] C    "
      // Row 1: "SP: [sp ] C  #=Set  "
      const home = makeScreen('Home', cols, rows, 'main');
      'Temp:   '.split('').forEach((c, i) => { home.cells[0][i] = c; });
      home.cells[0][12] = 'C';
      home.placeholders.push({ name: 'temp', col: 7, row: 0, width: 4 });
      'SP: '.split('').forEach((c, i) => { home.cells[1][i] = c; });
      home.cells[1][7] = 'C';
      '#=Set'.split('').forEach((c, i) => { home.cells[1][9 + i] = c; });
      home.placeholders.push({ name: 'sp', col: 4, row: 1, width: 2 });

      // Screen 1: SetTemp (settings) — editable setpoint 10–99
      // Row 0: "Set Temp:       "
      // Row 1: " Value: [   ] C "
      const setTempSc = makeScreen('SetTemp', cols, rows, 'settings');
      'Set Temp:'.split('').forEach((c, i) => { setTempSc.cells[0][i] = c; });
      ' Value: '.split('').forEach((c, i) => { setTempSc.cells[1][i] = c; });
      setTempSc.cells[1][12] = 'C';
      setTempSc.placeholders.push({
        name: 'setTemp', col: 8, row: 1, width: 3,
        editable: true, spMin: 10, spMax: 99, spStep: 1, spDefault: 22,
      });

      return {
        ...buildInitialState(),
        dt: '16x2',
        activeScreen: 0,
        screens: [home, setTempSc],
        inputMethod: '4x3kpd',
        navPins: {
          up: 2, down: 3, select: 4, back: 5,
          clk: 2, dt: 3, sw: 4,
          kpdR0: 2, kpdR1: 3, kpdR2: 4, kpdR3: 5,
          kpdC0: 6, kpdC1: 7, kpdC2: 8, kpdC3: 9,
        },
        transitions: [
          { from: 0, event: 'select', to: 1 },
          { from: 1, event: 'back',   to: 0 },
        ],
        codeOpen: false,
      };
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
