import { useEffect, useCallback, useRef } from 'react';
import { KeyboardShortcut, matchesShortcut } from '../utils/keyboard-utils';

/**
 * Options for the useKeyboardShortcuts hook
 */
interface UseKeyboardShortcutsOptions {
  /**
   * Enable or disable all shortcuts
   */
  enabled?: boolean;

  /**
   * Prevent default browser behavior for matched shortcuts
   */
  preventDefault?: boolean;

  /**
   * Stop event propagation for matched shortcuts
   */
  stopPropagation?: boolean;

  /**
   * Element to attach the event listener to (defaults to document)
   */
  target?: HTMLElement | Document | Window | null;
}

/**
 * Hook to manage keyboard shortcuts
 *
 * @example
 * ```tsx
 * const shortcuts: KeyboardShortcut[] = [
 *   {
 *     key: 'Enter',
 *     description: 'Execute query',
 *     requireModifier: true,
 *     action: executeQuery,
 *   },
 *   {
 *     key: 'k',
 *     description: 'Clear input',
 *     requireModifier: true,
 *     action: clearInput,
 *   },
 * ];
 *
 * useKeyboardShortcuts(shortcuts, { enabled: true });
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = typeof document !== 'undefined' ? document : null,
  } = options;

  // Use refs to avoid recreating the event handler on every render
  const shortcutsRef = useRef(shortcuts);
  const optionsRef = useRef(options);

  // Update refs when values change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    optionsRef.current = options;
  }, [shortcuts, options]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields (unless it's Escape)
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Allow Escape key even in input fields
    if (isInputField && event.key !== 'Escape') {
      return;
    }

    // Find matching shortcut
    const matchedShortcut = shortcutsRef.current.find((shortcut) =>
      matchesShortcut(event, shortcut.key, {
        requireModifier: shortcut.requireModifier,
        requireShift: shortcut.requireShift,
        requireAlt: shortcut.requireAlt,
      })
    );

    if (matchedShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }

      // Execute the action
      matchedShortcut.action();
    }
  }, [enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    if (!target || !enabled) return;

    // Add event listener
    target.addEventListener('keydown', handleKeyDown as EventListener);

    // Cleanup
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [target, enabled, handleKeyDown]);
}

/**
 * Hook to manage a single keyboard shortcut
 *
 * @example
 * ```tsx
 * useKeyboardShortcut('Escape', closeModal, { enabled: isModalOpen });
 * ```
 */
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: UseKeyboardShortcutsOptions & {
    requireModifier?: boolean;
    requireShift?: boolean;
    requireAlt?: boolean;
  } = {}
): void {
  const {
    requireModifier = false,
    requireShift = false,
    requireAlt = false,
    ...restOptions
  } = options;

  const shortcut: KeyboardShortcut = {
    key,
    description: '',
    requireModifier,
    requireShift,
    requireAlt,
    action,
  };

  useKeyboardShortcuts([shortcut], restOptions);
}
