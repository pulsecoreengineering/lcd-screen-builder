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

  const halBinding = `void lcd_gotoxy(uint8_t c, uint8_t r) { lcd.setCursor(c, r); }
void lcd_putchar(char c)              { lcd.write(c); }
void lcd_print(const char *s)         { lcd.print(s); }
void lcd_createChar(uint8_t s, const uint8_t *d) { lcd.createChar(s, d); }`

  const setupExample = `#include <LiquidCrystal.h>
#include "lcd_screens.h"

// Adjust pins to match your wiring: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

// HAL binding — forward HAL calls to LiquidCrystal
${halBinding}

void setup() {
  lcd.begin(${cfg[0]}, ${cfg[1]});
${usedCgram.length ? `  LCD_LoadCGRAM();          // load custom CGRAM characters\n` : ''}\
  LCD_Show_${namePascal}_Static();  // print all static rows
}

void loop() {
  // nothing yet
}`

  const dynamicExample = phs.length === 0
    ? `// No dynamic fields on "${screen.name}" yet.\n// Insert a placeholder and come back here.`
    : `#include <LiquidCrystal.h>
#include "lcd_screens.h"

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
${halBinding}

void setup() {
  lcd.begin(${cfg[0]}, ${cfg[1]});
${usedCgram.length ? `  LCD_LoadCGRAM();\n` : ''}\
  LCD_Show_${namePascal}_Static();   // draw static parts once
}

void updateDisplay() {
${phs.map(p => {
  const fn = p.name.replace(/[^a-zA-Z0-9]/g, '_')
  return `  // Field '${p.name}' is pinned at col=${p.col}, row=${p.row}, width=${p.width}
  char buf_${fn}[${p.width + 1}];
  snprintf(buf_${fn}, sizeof(buf_${fn}), "%s", /* your value here */ "");
  LCD_Update_${namePascal}_${fn}(buf_${fn});`
}).join('\n\n')}
}

void loop() {
  updateDisplay();
  delay(1000);
}`

  const progmemExample = `// lcd_screens.h stores all row strings in PROGMEM (AVR flash).
// LCD_Show_${namePascal}_Static() reads them with pgm_read_byte()
// internally — you never need to call pgm_read_byte yourself.

// On AVR (Uno / Nano / Mega):
//   PROGMEM puts strings in flash, saving SRAM.
//   pgm_read_byte() is used to fetch each byte.

// On non-AVR (ESP32, RP2040, STM32 ...):
//   PROGMEM is a no-op macro — the strings live in RAM as usual.
//   pgm_read_byte() dereferences the pointer directly.
//   Everything still compiles and works without changes.

// Custom chars (CGRAM) are also stored in PROGMEM arrays:
//   static const uint8_t cgram_0[8] PROGMEM = { 0x00, ... };
// LCD_LoadCGRAM() copies them to the LCD with lcd_createChar().`

  const fullHeader = generateHeader(state).join('\n')

  const tabs = ['Quick Start', 'Dynamic Fields', 'PROGMEM Tips', 'Full Header']
  const content = [setupExample, dynamicExample, progmemExample, fullHeader]

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
              <p className="guide-text">
                1. Place <code>lcd_screens.h</code> in the same folder as your <code>.ino</code> sketch.
              </p>
              <p className="guide-text">
                2. Add the four HAL functions shown below — they forward calls from the generated
                header to your LCD library. <code>LiquidCrystal</code>, <code>LiquidCrystal_I2C</code>,
                or any other library that exposes the same API all work.
              </p>
              <CodeBlock code={setupExample} />
            </div>
          )}
          {tab === 1 && (
            <div className="guide-section">
              <p className="guide-text">
                Call <code>LCD_Show_{namePascal}_Static()</code> once in <code>setup()</code> to
                draw all static text. Then call the per-field update helpers whenever the value changes.
                Each helper is pinned to fixed coordinates — editing static text never shifts them.
              </p>
              <CodeBlock code={dynamicExample} />
            </div>
          )}
          {tab === 2 && (
            <div className="guide-section">
              <p className="guide-text">
                Row strings and CGRAM bitmaps are stored in <code>PROGMEM</code> (AVR flash).
                The generated helpers handle <code>pgm_read_byte()</code> for you — no extra
                code needed on your side.
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
