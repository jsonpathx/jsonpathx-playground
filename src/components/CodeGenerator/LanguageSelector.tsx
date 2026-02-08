import { SupportedLanguage } from '../../types/code-generator';
import { getLanguageIcon } from '../../utils/syntax-highlight';
import { LANGUAGE_TEMPLATES } from '../../utils/code-templates';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
}

const LanguageSelector = ({ selectedLanguage, onChange }: LanguageSelectorProps) => {
  const languages: SupportedLanguage[] = [
    'javascript',
    'typescript',
    'python',
    'curl',
    'bash-jq',
    'browser',
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((language) => {
        const template = LANGUAGE_TEMPLATES[language];
        const isSelected = selectedLanguage === language;

        return (
          <button
            key={language}
            onClick={() => onChange(language)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center space-x-2
              ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
            title={template.description}
          >
            <span className="text-lg">{getLanguageIcon(language)}</span>
            <span>{template.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
