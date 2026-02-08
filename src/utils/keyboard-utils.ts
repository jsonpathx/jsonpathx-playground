/**
 * Keyboard utilities for handling shortcuts and OS detection
 */

/**
 * Detect the current operating system
 */
export function detectOS(): 'mac' | 'windows' | 'linux' | 'unknown' {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'unknown';
  }

  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac';
  }
  if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows';
  }
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Check if the current OS is Mac
 */
export function isMac(): boolean {
  return detectOS() === 'mac';
}

/**
 * Get the modifier key based on OS
 */
export function getModifierKey(): 'Meta' | 'Control' {
  return isMac() ? 'Meta' : 'Control';
}

/**
 * Get the display name for the modifier key
 */
export function getModifierKeyDisplay(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Check if the modifier key is pressed in an event
 */
export function isModifierPressed(event: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(key: string, useModifier = true): string {
  const modifier = useModifier ? getModifierKeyDisplay() : '';
  const separator = useModifier ? '+' : '';
  return `${modifier}${separator}${key}`;
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  key: string,
  options: {
    requireModifier?: boolean;
    requireShift?: boolean;
    requireAlt?: boolean;
  } = {}
): boolean {
  const {
    requireModifier = true,
    requireShift = false,
    requireAlt = false,
  } = options;

  // Check if the key matches (case-insensitive)
  const keyMatches = event.key.toLowerCase() === key.toLowerCase();

  // Check modifier requirements
  const modifierMatches = requireModifier ? isModifierPressed(event) : !isModifierPressed(event);
  const shiftMatches = requireShift ? event.shiftKey : !event.shiftKey;
  const altMatches = requireAlt ? event.altKey : !event.altKey;

  return keyMatches && modifierMatches && shiftMatches && altMatches;
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  description: string;
  requireModifier?: boolean;
  requireShift?: boolean;
  requireAlt?: boolean;
  action: () => void;
  category?: string;
}

/**
 * Default keyboard shortcuts configuration
 */
export const DEFAULT_SHORTCUTS = {
  EXECUTE_QUERY: { key: 'Enter', requireModifier: true },
  CLEAR_QUERY: { key: 'k', requireModifier: true },
  FOCUS_EXAMPLES: { key: 'e', requireModifier: true },
  TOGGLE_HISTORY: { key: 'h', requireModifier: true },
  SHOW_HELP: { key: '/', requireModifier: true },
  CLOSE_MODAL: { key: 'Escape', requireModifier: false },
  TOGGLE_THEME: { key: 'd', requireModifier: true },
} as const;
