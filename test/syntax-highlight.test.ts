import { describe, expect, it } from 'vitest';
import { highlightCode } from '../src/utils/syntax-highlight';
import { generateCode } from '../src/utils/code-generator';
import type { SupportedLanguage } from '../src/types/code-generator';

/** The text a browser shows for highlighted HTML. */
function visibleText(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent ?? '';
}

const data = [
  { model: 'Mehran', description: 'I m 100% original. Looking to sell the car urgently.', price: 790000 },
  { model: 'Corolla', description: 'Says "hi" // not a comment', price: 3500000 },
];

describe('highlightCode', () => {
  it.each<SupportedLanguage>(['javascript', 'typescript', 'browser'])('shows every character exactly once (%s)', (language) => {
    const { code } = generateCode(language, {
      query: '$[?(@.price > 1000000)].model',
      data,
      includeData: true,
      useAsync: true,
      includeErrorHandling: true,
      includeComments: true,
    });
    expect(visibleText(highlightCode(code, language))).toBe(code);
  });

  it('escapes HTML in the code', () => {
    const html = highlightCode('const s = "<img src=x onerror=alert(1)>";', 'javascript');
    expect(html).not.toContain('<img');
    expect(visibleText(html)).toBe('const s = "<img src=x onerror=alert(1)>";');
  });
});
