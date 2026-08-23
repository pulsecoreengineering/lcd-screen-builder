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
  const nameLo = screen.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const nameUp = screen.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  const cfg = { '16x2': [16, 2], '20x4': [20, 4], '128x64': [21, 8] }[state.dt] || [16, 2]
  const usedCgram = state.cgram.map((g, i) => (g ? i : -1)).filter(i => i >= 0)
  const phs = screen.placeholders

  const setupExample = `#include <LiquidCrystal.h>
#include "lcd_screens.h"

// Adjust pins to your wiring: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(${cfg[0]}, ${cfg[1]});
${usedCgram.length ? `  ${nameLo}_load_cgram();  // load custom chars\n` : ''}\
  // Print static rows
  lcd.setCursor(0, 0);
  lcd.print(${nameLo}_r0);
${cfg[1] > 1 ? `  lcd.setCursor(0, 1);\n  lcd.print(${nameLo}_r1);\n` : ''}\
}

void loop() {
  // nothing yet
}`

  const dynamicExample = phs.length === 0
    ? `// No dynamic fields on "${screen.name}" yet.\n// Insert a placeholder and come back here.`
    : `#include <LiquidCrystal.h>
#include "lcd_screens.h"

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(${cfg[0]}, ${cfg[1]});
${usedCgram.length ? `  ${nameLo}_load_cgram();\n` : ''}\
  // Print static content once
  lcd.setCursor(0, 0);
  lcd.print(${nameLo}_r0);
${cfg[1] > 1 ? `  lcd.setCursor(0, 1);\n  lcd.print(${nameLo}_r1);\n` : ''}}

void updateDisplay(${phs.map(p => `float ${p.name}`).join(', ')}) {
${phs.map(p => `  // Update field: ${p.name} (col ${p.col}, row ${p.row}, width ${p.width})
  lcd.setCursor(${nameUp}_F_${p.name.toUpperCase()}.col,
               ${nameUp}_F_${p.name.toUpperCase()}.row);
  lcd.print(${p.name}, 1);  // 1 decimal place`).join('\n')}
}

void loop() {
  // Example: call with real sensor readings
  // updateDisplay(${phs.map(() => '0.0').join(', ')});
  delay(1000);
}`

  const progmemExample = `// Reading PROGMEM strings on AVR (optional, saves RAM):
#include <avr/pgmspace.h>
#include "lcd_screens.h"

char buf[${cfg[0] + 1}];
strcpy_P(buf, ${nameLo}_r0);
lcd.setCursor(0, 0);
lcd.print(buf);

// On non-AVR (ESP32, RP2040, etc.) PROGMEM is a no-op,
// so lcd.print(${nameLo}_r0) works directly.`

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
                2. Use <code>LiquidCrystal</code> (HD44780) or <code>LiquidCrystal_I2C</code> for I²C modules.
              </p>
              <CodeBlock code={setupExample} />
            </div>
          )}
          {tab === 1 && (
            <div className="guide-section">
              <p className="guide-text">
                Each placeholder becomes a struct with <code>col</code>, <code>row</code>, <code>width</code>.
                Call <code>lcd.setCursor()</code> with those values before printing the live value.
              </p>
              <CodeBlock code={dynamicExample} />
            </div>
          )}
          {tab === 2 && (
            <div className="guide-section">
              <p className="guide-text">
                On AVR (Uno, Nano, Mega) strings in <code>PROGMEM</code> live in flash memory.
                On modern boards (ESP32, RP2040) the macro is a no-op — <code>lcd.print()</code> works directly.
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
