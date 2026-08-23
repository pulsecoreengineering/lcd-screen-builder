export const DISP = {
  '16x2':   { cols: 16, rows: 2,  label: '16×2 Char' },
  '20x4':   { cols: 20, rows: 4,  label: '20×4 Char' },
  '128x64': { cols: 21, rows: 8,  label: '128×64 GLCD', glcd: true },
};

export const PS = 3;
export const PG = 1;
export const CW = 5 * (PS + PG) + 4;
export const CH = 8 * (PS + PG) + 6;
export const PAD_X = 12;
export const PAD_Y = 10;

export const SPEC_CHARS = '←→↑↓°±×÷√∞αβγδεζθλμπσΩ♪♫■□▪▫▲▼◆◇★☆●○✓✗';
