import { SupportedLanguage } from '../types/code-generator';

/**
 * Simple regex-based syntax highlighting for code
 * Returns HTML with Tailwind CSS classes for styling
 */

export interface HighlightToken {
  type: string;
  value: string;
}

/**
 * Tokenize JavaScript/TypeScript code
 */
function tokenizeJavaScript(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const keywords = /\b(const|let|var|function|async|await|return|if|else|for|while|import|from|require|export|default|class|extends|try|catch|throw|new|typeof|instanceof|delete|void|this|super)\b/g;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const functions = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;

  let lastIndex = 0;
  const matches: Array<{ index: number; length: number; type: string; value: string }> = [];

  // Collect all matches
  let match;

  // Comments
  while ((match = comments.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'comment',
      value: match[0],
    });
  }

  // Strings
  while ((match = strings.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'string',
      value: match[0],
    });
  }

  // Keywords
  while ((match = keywords.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'keyword',
      value: match[0],
    });
  }

  // Functions
  while ((match = functions.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'function',
      value: match[0],
    });
  }

  // Numbers
  while ((match = numbers.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'number',
      value: match[0],
    });
  }

  // Sort by position
  matches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep first one)
  const filteredMatches = matches.filter((m, i) => {
    if (i === 0) return true;
    const prev = matches[i - 1];
    return m.index >= prev.index + prev.length;
  });

  // Build tokens
  filteredMatches.forEach((m) => {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: code.slice(lastIndex, m.index) });
    }
    tokens.push({ type: m.type, value: m.value });
    lastIndex = m.index + m.length;
  });

  if (lastIndex < code.length) {
    tokens.push({ type: 'text', value: code.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Tokenize Python code
 */
function tokenizePython(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const keywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|pass|break|continue|raise|yield|lambda|and|or|not|in|is|None|True|False)\b/g;
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*$/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const functions = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;

  let lastIndex = 0;
  const matches: Array<{ index: number; length: number; type: string; value: string }> = [];

  let match;

  // Comments
  while ((match = comments.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'comment',
      value: match[0],
    });
  }

  // Strings
  while ((match = strings.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'string',
      value: match[0],
    });
  }

  // Keywords
  while ((match = keywords.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'keyword',
      value: match[0],
    });
  }

  // Functions
  while ((match = functions.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'function',
      value: match[0],
    });
  }

  // Numbers
  while ((match = numbers.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'number',
      value: match[0],
    });
  }

  matches.sort((a, b) => a.index - b.index);

  const filteredMatches = matches.filter((m, i) => {
    if (i === 0) return true;
    const prev = matches[i - 1];
    return m.index >= prev.index + prev.length;
  });

  filteredMatches.forEach((m) => {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: code.slice(lastIndex, m.index) });
    }
    tokens.push({ type: m.type, value: m.value });
    lastIndex = m.index + m.length;
  });

  if (lastIndex < code.length) {
    tokens.push({ type: 'text', value: code.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Tokenize Shell/Bash code
 */
function tokenizeShell(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const keywords = /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|set|export|source)\b/g;
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*$/gm;
  const variables = /\$\{?[a-zA-Z_][a-zA-Z0-9_]*\}?/g;

  let lastIndex = 0;
  const matches: Array<{ index: number; length: number; type: string; value: string }> = [];

  let match;

  // Comments
  while ((match = comments.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'comment',
      value: match[0],
    });
  }

  // Strings
  while ((match = strings.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'string',
      value: match[0],
    });
  }

  // Variables
  while ((match = variables.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'variable',
      value: match[0],
    });
  }

  // Keywords
  while ((match = keywords.exec(code)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'keyword',
      value: match[0],
    });
  }

  matches.sort((a, b) => a.index - b.index);

  const filteredMatches = matches.filter((m, i) => {
    if (i === 0) return true;
    const prev = matches[i - 1];
    return m.index >= prev.index + prev.length;
  });

  filteredMatches.forEach((m) => {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: code.slice(lastIndex, m.index) });
    }
    tokens.push({ type: m.type, value: m.value });
    lastIndex = m.index + m.length;
  });

  if (lastIndex < code.length) {
    tokens.push({ type: 'text', value: code.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Get token class based on type
 */
function getTokenClass(type: string): string {
  switch (type) {
    case 'keyword':
      return 'text-purple-600 dark:text-purple-400 font-semibold';
    case 'string':
      return 'text-green-600 dark:text-green-400';
    case 'comment':
      return 'text-gray-500 dark:text-gray-500 italic';
    case 'number':
      return 'text-blue-600 dark:text-blue-400';
    case 'function':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'variable':
      return 'text-cyan-600 dark:text-cyan-400';
    default:
      return 'text-gray-900 dark:text-gray-300';
  }
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Convert tokens to HTML
 */
function tokensToHtml(tokens: HighlightToken[]): string {
  return tokens
    .map((token) => {
      const className = getTokenClass(token.type);
      const escapedValue = escapeHtml(token.value);
      if (token.type === 'text') {
        return escapedValue;
      }
      return `<span class="${className}">${escapedValue}</span>`;
    })
    .join('');
}

/**
 * Highlight code based on language
 */
export function highlightCode(code: string, language: SupportedLanguage): string {
  let tokens: HighlightToken[];

  switch (language) {
    case 'javascript':
    case 'typescript':
      tokens = tokenizeJavaScript(code);
      break;

    case 'python':
      tokens = tokenizePython(code);
      break;

    case 'bash-jq':
    case 'curl':
      tokens = tokenizeShell(code);
      break;

    case 'browser':
      // HTML - just do basic highlighting for script sections
      // For simplicity, we'll treat it as JavaScript for the script parts
      tokens = tokenizeJavaScript(code);
      break;

    default:
      // No highlighting, just escape HTML
      return escapeHtml(code);
  }

  return tokensToHtml(tokens);
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language: SupportedLanguage): string {
  const names: Record<SupportedLanguage, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    curl: 'cURL',
    'bash-jq': 'Bash + jq',
    browser: 'Browser',
  };
  return names[language] || language;
}

/**
 * Get language icon/emoji
 */
export function getLanguageIcon(language: SupportedLanguage): string {
  const icons: Record<SupportedLanguage, string> = {
    javascript: '🟨',
    typescript: '🔷',
    python: '🐍',
    curl: '🌐',
    'bash-jq': '💻',
    browser: '🌍',
  };
  return icons[language] || '📄';
}
