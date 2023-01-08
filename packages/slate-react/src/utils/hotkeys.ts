import { isKeyHotkey } from 'is-hotkey'
import { IS_APPLE } from './environment';

/**
 * Hotkey mappings for each platform.
 */
const HOTKEYS = {
  undo: 'mod+z',
}

const APPLE_HOTKEYS = {
  redo: 'cmd+shift+z',
}

const WINDOWS_HOTKEYS = {
  redo: ['ctrl+y', 'ctrl+shift+z'],
}

/**
 * Create a platform-aware hotkey checker.
 */
const create = (key: string) => {
  const generic = HOTKEYS[key]
  const apple = APPLE_HOTKEYS[key]
  const windows = WINDOWS_HOTKEYS[key]
  const isGeneric = generic && isKeyHotkey(generic)
  const isApple = apple && isKeyHotkey(apple)
  const isWindows = windows && isKeyHotkey(windows)

  return (event: KeyboardEvent) => {
    if (isGeneric && isGeneric(event)) return true
    if (IS_APPLE && isApple && isApple(event)) return true
    if (!IS_APPLE && isWindows && isWindows(event)) return true
    return false
  }
}

/**
 * Hotkeys.
 */
export default {
  isRedo: create('redo'),
  isUndo: create('undo'),
}
