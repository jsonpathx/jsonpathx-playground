import type { CodeGenerationOptions, GeneratedCode, SupportedLanguage } from '../types/code-generator';
import { LANGUAGE_TEMPLATES, formatDataForCode } from './code-templates';
import { JSONPATHX_VERSION } from '../version';

/** Options the snippet passes to jsonpathx: filters run in RFC 9535 mode, without eval. */
function queryOptionsLiteral(path: string): string {
  return path.includes('[?') ? ", { filterMode: 'rfc' }" : '';
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}

interface Parts {
  comments: boolean;
  errors: boolean;
}

/** `body` wrapped in try/catch when error handling is on. */
function guarded(body: string, onError: string, { errors }: Parts): string {
  if (!errors) return body;
  return `try {\n${indent(body, 2)}\n} catch (error) {\n${indent(onError, 2)}\n}`;
}

function comment(text: string, { comments }: Parts): string {
  return comments ? `// ${text}\n` : '';
}

function nodeCode(language: 'javascript' | 'typescript', options: CodeGenerationOptions): string {
  const { query: path, data, includeData, useAsync, maxDataPreview = 3 } = options;
  const parts: Parts = { comments: options.includeComments, errors: options.includeErrorHandling };
  const ts = language === 'typescript';
  const fn = useAsync ? 'query' : 'querySync';
  const invocation = `${fn}(path, data${queryOptionsLiteral(path)})`;
  // query() resolves to T[] (or a JSONPathQuery for the config form), so the
  // TypeScript version narrows it to an array.
  const call = useAsync ? (ts ? `(await ${invocation}) as unknown[]` : `await ${invocation}`) : invocation;
  const errorMessage = ts ? '(error as Error).message' : 'error.message';
  const lines: string[] = [];

  lines.push(`// Install: ${LANGUAGE_TEMPLATES[language]!.installCommand}`);
  lines.push(ts ? '// Run: npx tsc example.ts && node example.js (Node.js 22.12+)' : '// Run: node example.js (Node.js 22.12+)');
  lines.push('');

  // Imports. Sync JavaScript is CommonJS; everything else uses ES module syntax.
  if (!ts && !useAsync) {
    lines.push(`const { querySync } = require('@jsonpathx/jsonpathx');`);
    if (!includeData) lines.push(`const { readFileSync } = require('node:fs');`);
  } else {
    lines.push(`import { ${fn} } from '@jsonpathx/jsonpathx';`);
    if (!includeData) lines.push(`import { readFileSync } from 'node:fs';`);
  }
  lines.push('');

  lines.push(comment('Data to query', parts) + (includeData
    ? `const data${ts ? ': unknown' : ''} = ${formatDataForCode(data, maxDataPreview)};`
    : `const data${ts ? ': unknown' : ''} = JSON.parse(readFileSync('./data.json', 'utf8'));`));
  lines.push('');
  lines.push(comment('JSONPath query', parts) + `const path = ${JSON.stringify(path)};`);
  lines.push('');

  const run = comment('Run the query', parts) +
    `const results = ${call};\n` +
    `console.log(JSON.stringify(results, null, 2));\n` +
    `console.log(\`Found \${results.length} result(s)\`);`;
  const onError = `console.error('Error executing query:', ${errorMessage});\nprocess.exitCode = 1;`;

  if (useAsync) {
    // An async main() rather than top-level await, so the TypeScript output
    // also runs when tsc compiles to CommonJS (its default).
    lines.push(`async function main()${ts ? ': Promise<void>' : ''} {\n${indent(guarded(run, onError, parts), 2)}\n}`);
    lines.push('');
    lines.push('main();');
  } else {
    lines.push(guarded(run, onError, parts));
  }
  return lines.join('\n');
}

function browserCode(options: CodeGenerationOptions): string {
  const { query: path, data, includeData, maxDataPreview = 3 } = options;
  const parts: Parts = { comments: options.includeComments, errors: options.includeErrorHandling };
  const dataLine = includeData
    ? `const data = ${formatDataForCode(data, maxDataPreview)};`
    : `const data = await (await fetch('./data.json')).json();`;
  const run =
    comment('Run the query and show the results', parts) +
    `const results = await query(path, data${queryOptionsLiteral(path)});\n` +
    `const heading = document.createElement('h2');\n` +
    `heading.textContent = \`Query results (\${results.length} item(s))\`;\n` +
    `const pre = document.createElement('pre');\n` +
    `pre.textContent = JSON.stringify(results, null, 2);\n` +
    `output.replaceChildren(heading, pre);`;
  const onError = `const message = document.createElement('p');\nmessage.textContent = \`Error: \${error.message}\`;\noutput.replaceChildren(message);`;
  const script = [
    `import { query } from 'https://esm.sh/@jsonpathx/jsonpathx@${JSONPATHX_VERSION}';`,
    '',
    comment('Data to query', parts) + dataLine,
    comment('JSONPath query', parts) + `const path = ${JSON.stringify(path)};`,
    `const output = document.getElementById('results');`,
    '',
    guarded(run, onError, parts),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSONPathX browser example</title>
</head>
<body>
  <h1>JSONPathX browser example</h1>
  <div id="results">Running…</div>
  <script type="module">
${indent(script, 4)}
  </script>
</body>
</html>`;
}

/**
 * Generate a runnable snippet that reproduces the current query
 */
export function generateCode(language: SupportedLanguage, options: CodeGenerationOptions): GeneratedCode {
  const template = LANGUAGE_TEMPLATES[language];
  if (!template) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const code = language === 'browser' ? browserCode(options) : nodeCode(language, options);
  const filename = `jsonpathx-example-${Date.now()}.${template.extension}`;
  return { code: code.replace(/\n{3,}/g, '\n\n').trim() + '\n', language, filename };
}

/**
 * Generate code for all supported languages
 */
export function generateAllLanguages(options: CodeGenerationOptions): GeneratedCode[] {
  const languages: SupportedLanguage[] = [
    'javascript',
    'typescript',
    'browser',
  ];

  return languages.map((language) => generateCode(language, options));
}

/**
 * Get installation instructions for a language
 */
export function getInstallationInstructions(language: SupportedLanguage): string {
  const template = LANGUAGE_TEMPLATES[language];
  if (!template) {
    return 'Installation instructions not available';
  }

  const instructions: string[] = [];

  // Add language-specific setup
  switch (language) {
    case 'javascript':
      instructions.push('**Prerequisites:** Node.js 22.12+ installed');
      instructions.push('');
      instructions.push('**Installation:**');
      instructions.push('```bash');
      instructions.push(template.installCommand || template.install);
      instructions.push('```');
      instructions.push('');
      instructions.push('**Run:**');
      instructions.push('```bash');
      instructions.push('node example.js');
      instructions.push('```');
      break;

    case 'typescript':
      instructions.push('**Prerequisites:** Node.js 22.12+ installed');
      instructions.push('');
      instructions.push('**Installation:**');
      instructions.push('```bash');
      instructions.push(template.installCommand || template.install);
      instructions.push('```');
      instructions.push('');
      instructions.push('**Compile & Run:**');
      instructions.push('```bash');
      instructions.push('npx tsc example.ts');
      instructions.push('node example.js');
      instructions.push('```');
      break;

    case 'browser':
      instructions.push('**Prerequisites:** Modern web browser');
      instructions.push('');
      instructions.push('**Setup:**');
      instructions.push('1. The page loads JSONPathX as an ES module from esm.sh');
      instructions.push('2. Serve the folder (for example `npx serve .`) and open the HTML file');
      instructions.push('');
      instructions.push('**Alternative (with bundler):**');
      instructions.push('```bash');
      instructions.push(template.installCommand || '');
      instructions.push('# Then bundle with webpack/vite/parcel');
      instructions.push('```');
      break;

  }

  return instructions.join('\n');
}

/**
 * Get example output for a query
 */
export function getExampleOutput(results: unknown): string {
  if (results === null || results === undefined) {
    return '// No results';
  }

  if (Array.isArray(results)) {
    if (results.length === 0) {
      return '// Empty array - no matches found';
    }
    if (results.length > 3) {
      const preview = results.slice(0, 3);
      return `// Example output (showing first 3 of ${results.length}):\n${JSON.stringify(preview, null, 2)}\n// ... and ${results.length - 3} more`;
    }
  }

  return `// Example output:\n${JSON.stringify(results, null, 2)}`;
}

/**
 * Download generated code as a file
 */
export function downloadCode(code: string, filename: string): void {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
