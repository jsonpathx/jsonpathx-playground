import { LanguageTemplate } from '../types/code-generator';

/**
 * Escape special characters for JSON strings
 */
export function escapeJsonString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Format JSON data for code insertion with size limit
 */
export function formatDataForCode(data: unknown, maxItems = 3): string {
  if (Array.isArray(data)) {
    if (data.length > maxItems) {
      const preview = data.slice(0, maxItems);
      return JSON.stringify(preview, null, 2).replace(/\]$/, '  // ... and more items\n]');
    }
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Language templates for code generation
 */
export const LANGUAGE_TEMPLATES: Record<string, LanguageTemplate> = {
  javascript: {
    name: 'JavaScript (Node.js)',
    language: 'javascript',
    install: 'npm install @jsonpathx/jsonpathx',
    installCommand: 'npm install @jsonpathx/jsonpathx',
    extension: 'js',
    description: 'Node.js with CommonJS/ESM support',
    supportsAsync: true,
    template: `// Install dependencies: {{INSTALL}}
// File: example.js

{{IMPORTS}}

{{COMMENTS_START}}
// Sample data for JSONPath query
{{COMMENTS_END}}
const data = {{DATA}};

{{COMMENTS_START}}
// JSONPath query to execute
{{COMMENTS_END}}
const query = '{{QUERY}}';

{{ASYNC_START}}async function runQuery() {
  {{ERROR_HANDLING_START}}try {
    {{COMMENTS_START}}// Execute the JSONPath query
    {{COMMENTS_END}}{{ASYNC_END}}const results = {{QUERY_EXECUTION}};

    {{COMMENTS_START}}// Display results
    {{COMMENTS_END}}console.log('Query Results:');
    console.log(JSON.stringify(results, null, 2));
    console.log(\`\\nFound \${Array.isArray(results) ? results.length : 1} result(s)\`);
{{ASYNC_START}}  {{ERROR_HANDLING_START}}} catch (error) {
    console.error('Error executing query:', error.message);
    process.exit(1);
  }{{ERROR_HANDLING_END}}
}

runQuery();{{ASYNC_END}}{{ERROR_HANDLING_START}}{{SYNC_ONLY}} catch (error) {
  console.error('Error executing query:', error.message);
  process.exit(1);
}{{ERROR_HANDLING_END}}{{SYNC_ONLY}}`
  },

  typescript: {
    name: 'TypeScript',
    language: 'typescript',
    install: 'npm install @jsonpathx/jsonpathx',
    installCommand: 'npm install @jsonpathx/jsonpathx && npm install -D @types/node typescript',
    extension: 'ts',
    description: 'TypeScript with full type safety',
    supportsAsync: true,
    template: `// Install dependencies: {{INSTALL}}
// Install dev dependencies: npm install -D @types/node typescript
// Compile: npx tsc example.ts
// Run: node example.js

{{IMPORTS}}

{{COMMENTS_START}}
// Define types for your data structure
{{COMMENTS_END}}
interface DataItem {
  [key: string]: unknown;
}

{{COMMENTS_START}}
// Sample data for JSONPath query
{{COMMENTS_END}}
const data: DataItem[] | DataItem = {{DATA}};

{{COMMENTS_START}}
// JSONPath query to execute
{{COMMENTS_END}}
const query: string = '{{QUERY}}';

{{ASYNC_START}}async function runQuery(): Promise<void> {
  {{ERROR_HANDLING_START}}try {
    {{COMMENTS_START}}// Execute the JSONPath query
    {{COMMENTS_END}}{{ASYNC_END}}const results: unknown = {{QUERY_EXECUTION}};

    {{COMMENTS_START}}// Display results
    {{COMMENTS_END}}console.log('Query Results:');
    console.log(JSON.stringify(results, null, 2));
    console.log(\`\\nFound \${Array.isArray(results) ? results.length : 1} result(s)\`);
{{ASYNC_START}}  {{ERROR_HANDLING_START}}} catch (error) {
    console.error('Error executing query:', (error as Error).message);
    process.exit(1);
  }{{ERROR_HANDLING_END}}
}

runQuery();{{ASYNC_END}}{{ERROR_HANDLING_START}}{{SYNC_ONLY}} catch (error) {
  console.error('Error executing query:', (error as Error).message);
  process.exit(1);
}{{ERROR_HANDLING_END}}{{SYNC_ONLY}}`
  },

  browser: {
    name: 'Browser JavaScript',
    language: 'browser',
    install: 'Include via CDN or npm + bundler',
    installCommand: 'npm install @jsonpathx/jsonpathx',
    extension: 'html',
    description: 'Frontend JavaScript with fetch API',
    supportsAsync: true,
    template: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSONPathX Browser Example</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    pre {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .error {
      color: #dc2626;
      background: #fee;
      padding: 10px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>JSONPathX Browser Example</h1>
    <div id="results"></div>
  </div>

  {{BROWSER_SCRIPT}}
  <script>
    {{COMMENTS_START}}// Sample data for JSONPath query{{COMMENTS_END}}
    const data = {{DATA}};

    {{COMMENTS_START}}// JSONPath query to execute{{COMMENTS_END}}
    const query = '{{QUERY}}';

    {{COMMENTS_START}}// Execute query and display results{{COMMENTS_END}}
    async function runQuery() {
      const resultsDiv = document.getElementById('results');

      {{ERROR_HANDLING_START}}try {
        {{COMMENTS_END}}{{COMMENTS_START}}// Execute the JSONPath query{{COMMENTS_END}}
        const results = {{QUERY_EXECUTION}};

        {{COMMENTS_START}}// Display results{{COMMENTS_END}}
        const resultCount = Array.isArray(results) ? results.length : 1;
        resultsDiv.innerHTML = \`
          <h2>Query Results (\${resultCount} item(s))</h2>
          <pre>\${JSON.stringify(results, null, 2)}</pre>
        \`;
      {{ERROR_HANDLING_START}}} catch (error) {
        resultsDiv.innerHTML = \`
          <div class="error">
            <strong>Error:</strong> \${error.message}
          </div>
        \`;
      }{{ERROR_HANDLING_END}}
    }

    {{COMMENTS_START}}// Run on page load{{COMMENTS_END}}
    runQuery();
  </script>
</body>
</html>`
  }
};

/**
 * Generate import statements based on language and async preference
 */
export function generateImports(language: string, useAsync: boolean): string {
  switch (language) {
    case 'javascript':
      if (useAsync) {
        return `import { query } from '@jsonpathx/jsonpathx';`;
      }
      return `const { query } = require('@jsonpathx/jsonpathx');`;

    case 'typescript':
      return `import { query } from '@jsonpathx/jsonpathx';`;

    default:
      return '';
  }
}

/**
 * Generate query execution code
 */
export function generateQueryExecution(language: string, useAsync: boolean): string {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return useAsync ? 'await query(query, data)' : 'query(query, data)';

    case 'browser':
      return 'await query(query, data)';

    default:
      return '';
  }
}

/**
 * Get CDN script tag for browser usage
 */
export function getBrowserScriptTag(): string {
  return `<!-- Option 1: Use CDN (if available) -->
  <!-- <script src="https://unpkg.com/@jsonpathx/jsonpathx"></script> -->

  <!-- Option 2: Use bundled version -->
  <!-- Include your bundled jsonpathx library here -->
  <script type="module">
    import { query } from './path/to/jsonpathx.js';
    window.jsonpathx = { query };
  </script>`;
}
