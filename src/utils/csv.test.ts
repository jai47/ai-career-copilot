import { describe, expect, it } from 'vitest';
import { escapeCsvCell, rowsToCsv } from './csv';

describe('csv helpers', () => {
  it('escapes commas and quotes', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell(null)).toBe('');
  });

  it('builds a csv string with header row', () => {
    const csv = rowsToCsv(['title', 'company'], [['Eng, AI', 'OpenAI']]);
    expect(csv).toBe('title,company\n"Eng, AI",OpenAI\n');
  });
});
