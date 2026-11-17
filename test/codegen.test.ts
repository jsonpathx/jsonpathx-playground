import { createRequire } from 'node:module';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import * as jsonpathx from '@jsonpathx/jsonpathx';
import { generateCode } from '../src/utils/code-generator';
import type { CodeGenerationOptions } from '../src/types/code-generator';
import { JSONPATHX_VERSION } from '../src/version';

const cars = [
  { model: 'Mehran', brand: { name: 'Suzuki' }, modelDate: 2013 },
  { model: 'Corolla', brand: { name: 'Toyota' }, modelDate: 2018 },
  { model: "Civic 'Turbo'", brand: { name: 'Honda' }, modelDate: 2020 },
];

const base: CodeGenerationOptions = {
  query: '$[?(@.brand.name == "Toyota")].model',
  data: cars,
  includeData: true,
  useAsync: true,
  includeErrorHandling: true,
  includeComments: true,
  maxDataPreview: 3,
};

const require = createRequire(import.meta.url);

/** Run a generated Node snippet and return what it logged. */
async function run(code: string): Promise<unknown[][]> {
  const logs: unknown[][] = [];
  const fakeConsole = { log: (...args: unknown[]) => logs.push(args), error: vi.fn() };
  const fakeProcess = { exitCode: 0 };
  // ES module imports become a lookup on the real module, so the snippet runs
  // as a function body; `main();` becomes `return main();` so we can await it.
  const body = code
    .replace(/^import \{ (\w+) \} from '@jsonpathx\/jsonpathx';$/m, 'const { $1 } = jsonpathx;')
    .replace(/^main\(\);$/m, 'return main();');
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...args: string[]) => (
    ...args: unknown[]
  ) => Promise<void>;
  await new AsyncFunction('require', 'jsonpathx', 'console', 'process', body)(require, jsonpathx, fakeConsole, fakeProcess);
  expect(fakeConsole.error).not.toHaveBeenCalled();
  expect(fakeProcess.exitCode).toBe(0);
  return logs;
}

function typeErrors(code: string): string[] {
  const fileName = `${process.cwd()}/example.generated.ts`; // never written to disk
  const options: ts.CompilerOptions = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, types: ['node'], skipLibCheck: true };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, lang, ...rest) =>
    name === fileName ? ts.createSourceFile(name, code, lang) : getSourceFile(name, lang, ...rest);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (name) => name === fileName || fileExists(name);
  // Resolve '@jsonpathx/jsonpathx' and @types/node from this project.
  host.getCurrentDirectory = () => process.cwd();
  const program = ts.createProgram([fileName], { ...options, typeRoots: [`${process.cwd()}/node_modules/@types`] }, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName === fileName)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

describe('generated JavaScript', () => {
  it('async (ES module) runs and prints the filtered results', async () => {
    const { code } = generateCode('javascript', base);
    expect(code).toContain("import { query } from '@jsonpathx/jsonpathx';");
    expect(code).toContain("{ filterMode: 'rfc' }");
    const logs = await run(code);
    expect(JSON.parse(String(logs[0]![0]))).toEqual(['Corolla']);
    expect(logs[1]![0]).toBe('Found 1 result(s)');
  });

  it('sync (CommonJS) uses querySync', async () => {
    const { code } = generateCode('javascript', { ...base, useAsync: false });
    expect(code).toContain("const { querySync } = require('@jsonpathx/jsonpathx');");
    const logs = await run(code);
    expect(JSON.parse(String(logs[0]![0]))).toEqual(['Corolla']);
  });

  it('works without error handling and comments, and with quotes in the data', async () => {
    const { code } = generateCode('javascript', {
      ...base,
      query: '$[*].model',
      includeErrorHandling: false,
      includeComments: false,
    });
    expect(code).not.toContain('try {');
    expect(code).not.toMatch(/\/\/ (Data to query|JSONPath query|Run the query)/);
    expect(code).not.toContain('filterMode');
    const logs = await run(code);
    expect(JSON.parse(String(logs[0]![0]))).toEqual(['Mehran', 'Corolla', "Civic 'Turbo'"]);
  });

  it('escapes the query as a string literal', async () => {
    const { code } = generateCode('javascript', { ...base, query: "$[?(@.model == \"Civic 'Turbo'\")].brand.name" });
    const logs = await run(code);
    expect(JSON.parse(String(logs[0]![0]))).toEqual(['Honda']);
  });

  it('reads data.json when the data is not inlined', () => {
    const { code } = generateCode('javascript', { ...base, includeData: false, useAsync: false });
    expect(code).toContain("JSON.parse(readFileSync('./data.json', 'utf8'))");
  });
});

describe('generated TypeScript', () => {
  it.each([true, false])('type-checks and runs (async: %s)', async (useAsync) => {
    const { code } = generateCode('typescript', { ...base, useAsync });
    expect(typeErrors(code)).toEqual([]);
    const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const logs = await run(js);
    expect(JSON.parse(String(logs[0]![0]))).toEqual(['Corolla']);
  });
});

describe('generated browser page', () => {
  it('imports the pinned version from esm.sh', () => {
    const { code, filename } = generateCode('browser', base);
    expect(code).toContain(`https://esm.sh/@jsonpathx/jsonpathx@${JSONPATHX_VERSION}`);
    expect(code).toContain('<script type="module">');
    expect(filename).toMatch(/\.html$/);
  });
});
