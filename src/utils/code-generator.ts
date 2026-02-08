import { CodeGenerationOptions, GeneratedCode, SupportedLanguage } from '../types/code-generator';
import {
  LANGUAGE_TEMPLATES,
  formatDataForCode,
  escapeJsonString,
  generateImports,
  generateQueryExecution,
  getBrowserScriptTag,
} from './code-templates';

/**
 * Generate code for a specific language
 */
export function generateCode(
  language: SupportedLanguage,
  options: CodeGenerationOptions
): GeneratedCode {
  const template = LANGUAGE_TEMPLATES[language];
  if (!template) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const {
    query,
    data,
    includeData,
    useAsync,
    includeErrorHandling,
    includeComments,
    maxDataPreview = 3,
  } = options;

  let code = template.template;

  // Replace installation command
  code = code.replace(/{{INSTALL}}/g, template.install);

  // Replace imports
  const imports = generateImports(language, useAsync);
  code = code.replace(/{{IMPORTS}}/g, imports);

  // Replace data
  if (includeData) {
    const formattedData = formatDataForCode(data, maxDataPreview);
    code = code.replace(/{{DATA}}/g, formattedData);
  } else {
    if (language === 'browser') {
      code = code.replace(/{{DATA}}/g, `await (await fetch('./data.json')).json()  // Load from file`);
    } else {
      code = code.replace(/{{DATA}}/g, `require('./data.json')  // Load from file`);
    }
  }

  // Replace query
  const escapedQuery = escapeJsonString(query);
  code = code.replace(/{{QUERY}}/g, escapedQuery);

  // Replace query execution
  const queryExecution = generateQueryExecution(language, useAsync);
  code = code.replace(/{{QUERY_EXECUTION}}/g, queryExecution);

  // Handle async/await sections
  if (useAsync && template.supportsAsync) {
    code = code.replace(/{{ASYNC_START}}/g, '');
    code = code.replace(/{{ASYNC_END}}/g, '');
    code = code.replace(/{{SYNC_ONLY}}/g, '// ');
  } else {
    // Remove async sections
    code = code.replace(/{{ASYNC_START}}[\s\S]*?{{ASYNC_END}}/g, '');
    code = code.replace(/{{SYNC_ONLY}}/g, '');
  }

  // Handle error handling sections
  if (includeErrorHandling) {
    code = code.replace(/{{ERROR_HANDLING_START}}/g, '');
    code = code.replace(/{{ERROR_HANDLING_END}}/g, '');
    code = code.replace(/{{ERROR_HANDLING_IMPORT}}/g, '');
  } else {
    // Remove error handling sections
    code = code.replace(/{{ERROR_HANDLING_START}}[\s\S]*?{{ERROR_HANDLING_END}}/g, '');
    code = code.replace(/{{ERROR_HANDLING_IMPORT}}/g, '');
  }

  // Handle comments
  if (includeComments) {
    code = code.replace(/{{COMMENTS_START}}/g, '');
    code = code.replace(/{{COMMENTS_END}}/g, '');
  } else {
    // Remove comment sections
    code = code.replace(/{{COMMENTS_START}}[\s\S]*?{{COMMENTS_END}}/g, '');
  }

  // Handle browser-specific script tag
  if (language === 'browser') {
    code = code.replace(/{{BROWSER_SCRIPT}}/g, getBrowserScriptTag());
  }

  // Clean up extra blank lines
  code = code.replace(/\n\n\n+/g, '\n\n');
  code = code.trim();

  // Generate filename
  const timestamp = Date.now();
  const filename = `jsonpathx-example-${timestamp}.${template.extension}`;

  return {
    code,
    language,
    filename,
  };
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
      instructions.push('**Prerequisites:** Node.js 16+ installed');
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
      instructions.push('**Prerequisites:** Node.js 16+ installed');
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
      instructions.push('1. Include JSONPathX library via CDN or bundler');
      instructions.push('2. Open the HTML file in a browser');
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
