import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModifierKeyDisplay } from '../utils/keyboard-utils';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component that displays all available keyboard shortcuts
 */
const KeyboardShortcutsHelp = ({ isOpen, onClose }: KeyboardShortcutsHelpProps) => {
  const modifierKey = getModifierKeyDisplay();

  // Define all shortcuts grouped by category
  const shortcuts: ShortcutItem[] = [
    {
      keys: [modifierKey, 'Enter'],
      description: 'Execute current query',
      category: 'Query Actions',
    },
    {
      keys: [modifierKey, 'K'],
      description: 'Clear query input',
      category: 'Query Actions',
    },
    {
      keys: [modifierKey, 'B'],
      description: 'Open visual query builder',
      category: 'Query Actions',
    },
    {
      keys: [modifierKey, 'E'],
      description: 'Focus on example queries',
      category: 'Navigation',
    },
    {
      keys: [modifierKey, 'H'],
      description: 'Toggle query history panel',
      category: 'Navigation',
    },
    {
      keys: ['Escape'],
      description: 'Close any open modals',
      category: 'Navigation',
    },
    {
      keys: [modifierKey, 'D'],
      description: 'Toggle dark/light theme',
      category: 'Appearance',
    },
    {
      keys: [modifierKey, '/'],
      description: 'Show this help modal',
      category: 'Help',
    },
  ];

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  const categories = Object.keys(groupedShortcuts);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Render the modal using a portal
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2
              id="shortcuts-modal-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Boost your productivity with these shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close shortcuts help"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide text-sm">
                {category}
              </h3>
              <div className="space-y-2">
                {groupedShortcuts[category].map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                  >
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center">
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm min-w-[2rem] text-center">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-500 dark:text-gray-400 mx-1 text-xs">
                              +
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Tip: Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Escape</kbd> to close this modal
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KeyboardShortcutsHelp;
