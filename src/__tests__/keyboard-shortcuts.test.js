import { describe, expect, it, afterEach } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { createBlockKeyboardShortcuts, isApplePlatform } from '../utils/keyboard-shortcuts'

const createEditor = (content) => new Editor({
  extensions: [StarterKit],
  content,
})

const createEvent = (key, options = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...options,
})

const withModifier = (event) => (isApplePlatform()
  ? { ...event, metaKey: true }
  : { ...event, ctrlKey: true })

describe('block keyboard shortcuts', () => {
  let editor = null

  afterEach(() => {
    editor?.destroy?.()
    editor = null
  })

  it('opens the insert menu on the block menu shortcut', () => {
    editor = createEditor('<p>first</p>')
    const openInsertMenu = vi.fn()
    const handler = createBlockKeyboardShortcuts(editor, { openInsertMenu })

    const event = withModifier(createEvent('/'))
    expect(handler(editor.view, event)).toBe(true)
    expect(openInsertMenu).toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('moves the current block with the move shortcuts', () => {
    editor = createEditor('<p>first</p><p>second</p>')
    editor.commands.setTextSelection(2)
    const handler = createBlockKeyboardShortcuts(editor, {})

    const event = withModifier(createEvent('ArrowDown', { shiftKey: true }))
    expect(handler(editor.view, event)).toBe(true)
    expect(editor.getText().replace(/\n+/g, '|')).toBe('second|first')
  })

  it('duplicates the current block', () => {
    editor = createEditor('<p>first</p>')
    editor.commands.setTextSelection(2)
    const handler = createBlockKeyboardShortcuts(editor, {})

    const event = withModifier(createEvent('d'))
    expect(handler(editor.view, event)).toBe(true)
    expect(editor.getText().replace(/\n+/g, '|')).toBe('first|first')
  })

  it('selects the current block on escape', () => {
    editor = createEditor('<p>first</p>')
    editor.commands.setTextSelection(2)
    const handler = createBlockKeyboardShortcuts(editor, {})

    const event = createEvent('Escape')
    expect(handler(editor.view, event)).toBe(true)
    expect(editor.state.selection.constructor.name).toBe('NodeSelection')
  })

  it('toggles bold with the format shortcut', () => {
    editor = createEditor('<p>first</p>')
    editor.commands.setTextSelection(1, 3)
    const handler = createBlockKeyboardShortcuts(editor, {})

    const event = withModifier(createEvent('b'))
    expect(handler(editor.view, event)).toBe(true)
    expect(editor.isActive('bold')).toBe(true)
  })

  it('opens the link dialog with the link shortcut', () => {
    editor = createEditor('<p>first</p>')
    const openLink = vi.fn()
    const handler = createBlockKeyboardShortcuts(editor, { openLink })

    const event = withModifier(createEvent('k'))
    expect(handler(editor.view, event)).toBe(true)
    expect(openLink).toHaveBeenCalled()
  })

  it('ignores unrelated key presses', () => {
    editor = createEditor('<p>first</p>')
    const handler = createBlockKeyboardShortcuts(editor, {})

    expect(handler(editor.view, createEvent('a'))).toBe(false)
  })
})
