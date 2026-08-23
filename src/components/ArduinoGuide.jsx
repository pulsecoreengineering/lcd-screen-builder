import { useState } from 'react'
import { useStore } from '../store'
import { generateHeader } from '../headerGen'

function Tab({ active, onClick, children }) {
  return (
    <button
      className={'guide-tab' + (active ? ' active' : '')}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="guide-code-wrap">
      <button className="guide-copy-btn" onClick={copy}>
        {copied ? '✓ Copied' : '⎘ Copy'}
      </button>
      <pre className="guide-code">{code}</pre>
    </div>
  )
}

export default function ArduinoGuide({ open, onClose }) {
  const { state } = useStore()
  const [tab, setTab] = useState(0)

  if (!open) return null

  const screen = state.screens[state.activeScreen]
  const namePascal = screen.name.replace(/[^a-zA-Z0-9]/g, '_')
  const cfg = { '16x2': [16, 2], '20x4': [20, 4], '128x64': [21, 8] }[state.dt] || [16, 2]
  const usedCgram = state.cgram.map((g, i) => (g ? i : -1)).filter(i => i >= 0)
  const phs = screen.placeholders
  const lib = state.targetLib || 'custom'
  const i2cAddr = state.i2cAddr || '0x27'

  // Quick Start tab
  let setupExample
  if (lib === 'liquidcrystal_i2c') {
    setupExample = `// Self-contained — no HAL functions needed in your sketch.
// Optionally override I2C address before the #include:
//   #define LCD_I2C_ADDR ${i2cAddr}

#include "lcd_screens.h"

void setup() {
  LCD_Init();           // init + backlight
${usedCgram.length ? `  LCD_LoadCGRAM();    // load custom chars\n` : ''}\
  LCD_Show_${namePascal}_Static();
}

void loop() {
}`
  } else if (lib === 'liquidcrystal') {
    setupExample = `// Self-contained — no HAL functions needed in your sketch.
// Override pin defaults before the #include if needed:
//   #define LCD_RS 12  #define LCD_EN 11
//   #define LCD_D4  5  #define LCD_D5  4  #define LCD_D6  3  #define LCD_D7  2

#include "lcd_screens.h"

void setup() {
  LCD_Init();           // lcd.begin(${cfg[0]}, ${cfg[1]})
${usedCgram.length ? `  LCD_LoadCGRAM();    // load custom chars\n` : ''}\
  LCD_Show_${namePascal}_Static();
}

void loop() {
}`
  } else {
    setupExample = `#include <LiquidCrystal_I2C.h>   // or LiquidCrystal.h
#include "lcd_screens.h"

LiquidCrystal_I2C lcd(${i2cAddr}, ${cfg[0]}, ${cfg[1]});

// HAL bindings — wire the header to your library
void lcd_gotoxy(uint8_t c, uint8_t r)             { lcd.setCursor(c, r); }
void lcd_putchar(char c)                           { lcd.write(c); }
void lcd_print(const char *s)                      { lcd.print(s); }
void lcd_createChar(uint8_t s, const uint8_t *d)  { lcd.createChar(s, (uint8_t*)d); }

void setup() {
  lcd.init();
  lcd.backlight();
${usedCgram.length ? `  LCD_LoadCGRAM();\n` : ''}\
  LCD_Show_${namePascal}_Static();
}

void loop() {
}`
  }

  // Dynamic Fields tab
  const dynamicExample = phs.length === 0
    ? `// No dynamic fields on "${screen.name}" yet.\n// Insert a placeholder and come back here.`
    : `${lib !== 'custom' ? '#include "lcd_screens.h"\n\n' : ''}\
void updateDisplay() {
${phs.map(p => {
  const fn = p.name.replace(/[^a-zA-Z0-9]/g, '_')
  return `  // '${p.name}' — col=${p.col}, row=${p.row}, width=${p.width}
  char buf_${fn}[${p.width + 1}];
  snprintf(buf_${fn}, sizeof(buf_${fn}), "%s", /* your value */ "");
  LCD_Update_${namePascal}_${fn}(buf_${fn});`
}).join('\n\n')}
}`

  const progmemExample = `// All row strings are stored in PROGMEM (AVR flash memory).
// LCD_Show_${namePascal}_Static() reads them with pgm_read_byte()
// internally — you never call pgm_read_byte yourself.
//
// On AVR (Uno / Nano / Mega):
//   PROGMEM stores strings in flash, saving SRAM.
//
// On non-AVR (ESP32, RP2040, STM32 ...):
//   PROGMEM is a no-op — strings live in RAM.
//   pgm_read_byte() dereferences the pointer directly.
//   Everything compiles and works without changes.
${usedCgram.length ? `
// CGRAM bitmaps are also stored in PROGMEM:
//   static const uint8_t cgram_0[8] PROGMEM = { 0x0e, ... };
// LCD_LoadCGRAM() copies them to the LCD via lcd_createChar().` : ''}`

  const fullHeader = generateHeader(state).join('\n')

  const tabs = ['Quick Start', 'Dynamic Fields', 'PROGMEM Tips', 'Full Header']

  return (
    <div className="guide-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="guide-modal">
        <div className="guide-header">
          <div className="guide-title">
            <span className="guide-title-badge">?</span>
            Arduino Usage Guide
          </div>
          <button className="guide-close" onClick={onClose}>✕</button>
        </div>
        <div className="guide-tabs">
          {tabs.map((t, i) => (
            <Tab key={i} active={tab === i} onClick={() => setTab(i)}>{t}</Tab>
          ))}
        </div>
        <div className="guide-body">
          {tab === 0 && (
            <div className="guide-section">
              {lib !== 'custom' ? (
                <p className="guide-text">
                  The header is <strong>self-contained</strong> — it includes the library and
                  defines <code>LCD_Init()</code> for you. Just copy <code>lcd_screens.h</code>{' '}
                  into your sketch folder.
                </p>
              ) : (
                <p className="guide-text">
                  Custom HAL mode — add the four binding functions shown below, then call
                  <code>LCD_Show_{namePascal}_Static()</code>.
                </p>
              )}
              <CodeBlock code={setupExample} />
            </div>
          )}
          {tab === 1 && (
            <div className="guide-section">
              <p className="guide-text">
                Call <code>LCD_Show_{namePascal}_Static()</code> once in <code>setup()</code> to
                draw static text. Then call the per-field helpers whenever values change — each one
                is pinned to fixed coordinates.
              </p>
              <CodeBlock code={dynamicExample} />
            </div>
          )}
          {tab === 2 && (
            <div className="guide-section">
              <p className="guide-text">
                Row strings and CGRAM bitmaps are in <code>PROGMEM</code>. The generated helpers
                handle <code>pgm_read_byte()</code> internally — no extra code needed.
              </p>
              <CodeBlock code={progmemExample} />
            </div>
          )}
          {tab === 3 && (
            <div className="guide-section">
              <p className="guide-text">The complete generated header for all your screens:</p>
              <CodeBlock code={fullHeader} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
