import { createContext, useContext, useReducer } from 'react';
import { DISP } from './constants';

function makeScreen(name, cols, rows) {
  return {
    name,
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
        screens: [...state.screens, makeScreen(action.name, cfg.cols, cfg.rows)],
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
