import { isKeyHotkey } from 'is-hotkey'
import { IS_APPLE } from './environment';

/**
 * Hotkey mappings for each platform.
 */
const HOTKEYS = {
  undo: 'mod+z',
  moveBackward: 'left',
  moveForward: 'right',
  deleteBackward: 'shift?+backspace',
}

const APPLE_HOTKEYS = {
  redo: 'cmd+shift+z',
  deleteBackward: ['ctrl+backspace', 'ctrl+h'],
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
  isMoveBackward: create('moveBackward'), // 往前移动
  isMoveForward: create('moveForward'), // 往后移动
  isDeleteBackward: create('deleteBackward'),
}
