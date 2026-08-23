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

const KW = new Set(['static', 'const', 'typedef', 'struct', 'void', 'return', 'if', 'else']);
const TY = new Set(['uint8_t', 'char', 'lcd_field_t', 'int']);

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function syntaxHL(line) {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('/*') || trimmed.startsWith('//')) {
    return `<span class="c-cm">${esc(line)}</span>`;
  }

  let out = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];

    if (ch === '#') {
      let j = i + 1;
      while (j < line.length && /\w/.test(line[j])) j++;
      out += `<span class="c-pp">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\') j++;
        j++;
      }
      j++;
      out += `<span class="c-st">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /\w/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KW.has(word)) {
        out += `<span class="c-kw">${esc(word)}</span>`;
      } else if (TY.has(word)) {
        out += `<span class="c-ty">${esc(word)}</span>`;
      } else if (word === 'PROGMEM') {
        out += `<span class="c-fn">${esc(word)}</span>`;
      } else {
        out += esc(word);
      }
      i = j;
      continue;
    }

    if (line[i] === '0' && line[i + 1] === 'x') {
      let j = i + 2;
      while (j < line.length && /[0-9a-fA-F]/.test(line[j])) j++;
      out += `<span class="c-nu">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    if (/\d/.test(ch)) {
      let j = i;
      while (j < line.length && /\d/.test(line[j])) j++;
      out += `<span class="c-nu">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    out += esc(ch);
    i++;
  }

  return out;
}
