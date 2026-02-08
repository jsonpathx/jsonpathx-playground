export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'curl'
  | 'bash-jq'
  | 'browser';

export interface LanguageTemplate {
  name: string;
  language: SupportedLanguage;
  install: string;
  installCommand?: string;
  template: string;
  extension: string;
  description: string;
  supportsAsync: boolean;
}

export interface CodeGenerationOptions {
  query: string;
  data: unknown;
  includeData: boolean;
  useAsync: boolean;
  includeErrorHandling: boolean;
  includeComments: boolean;
  maxDataPreview?: number;
}

export interface GeneratedCode {
  code: string;
  language: SupportedLanguage;
  filename: string;
}
