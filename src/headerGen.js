export function generateHeader(state) {
  const { dt, screens, cgram } = state;
  const lines = [];
  const push = (...args) => lines.push(...args);

  push(
    '#include <stdint.h>',
    '#ifdef __AVR__',
    '  #include <avr/pgmspace.h>',
    '#else',
    '  #define PROGMEM',
    '  #define pgm_read_byte(p) (*(const uint8_t*)(p))',
    '#endif',
    ''
  );

  const usedCgram = cgram.map((g, i) => (g ? i : -1)).filter(i => i >= 0);
  if (usedCgram.length) {
    push('/* ── Custom Characters (CGRAM) ──────────────────────────────────── */');
    usedCgram.forEach(i => {
      const g = cgram[i];
      const bytes = g.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ');
      push(`static const uint8_t PROGMEM cgram_${i}[8] = { ${bytes} };`);
    });
    push('');
  }

  screens.forEach(s => {
    const nameUp = s.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const nameLo = s.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cols = s.cells[0]?.length || 16;
    const rows = s.cells.length;

    push(`/* ── Screen: ${s.name} (${dt}) ─────────────────────────────── */`);

    for (let r = 0; r < rows; r++) {
      const row = (s.cells[r] || [])
        .map((c, ci) => {
          if (s.placeholders.find(p => p.row === r && ci >= p.col && ci < p.col + p.width))
            return ' ';
          return c === '\x00' ? '\\x00' : c.charCodeAt(0) < 32 ? '?' : c;
        })
        .join('')
        .replace(/\s+$/, '');
      if (row) push(`static const char PROGMEM ${nameLo}_r${r}[] = "${row}";`);
    }

    if (s.placeholders.length) {
      push('');
      push('/* Dynamic field positions */');
      push('typedef struct { uint8_t col; uint8_t row; uint8_t width; } lcd_field_t;');
      s.placeholders.forEach(p => {
        push(
          `static const lcd_field_t PROGMEM ${nameUp}_F_${p.name.toUpperCase()} = { ${p.col}, ${p.row}, ${p.width} };`
        );
      });
    }

    if (usedCgram.length) {
      push('');
      push(`/* Load custom chars for ${s.name} */`);
      push(`void ${nameLo}_load_cgram(void) {`);
      usedCgram.forEach(i => push(`  lcd_create_char(${i}, cgram_${i});`));
      push('}');
    }

    push('');
  });

  return lines;
}

export function syntaxHL(line) {
  let s = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (/^\/\*/.test(s.trim()) || /^\/\//.test(s.trim()))
    return `<span class="c-cm">${s}</span>`;
  s = s.replace(/(#\w+)/g, '<span class="c-pp">$1</span>');
  s = s.replace(
    /\b(static|const|typedef|struct|void|return|if|else)\b/g,
    '<span class="c-kw">$1</span>'
  );
  s = s.replace(
    /\b(uint8_t|char|lcd_field_t|int)\b/g,
    '<span class="c-ty">$1</span>'
  );
  s = s.replace(/\bPROGMEM\b/g, '<span class="c-fn">PROGMEM</span>');
  s = s.replace(/"([^"]*)"/g, '<span class="c-st">"$1"</span>');
  s = s.replace(/\b(0x[0-9a-fA-F]+|\d+)\b/g, '<span class="c-nu">$1</span>');
  return s;
}
