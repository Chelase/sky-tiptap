import { describe, expect, it, afterEach } from 'vitest'
import {
  clearEditorRegistry,
  getActiveEditor,
  getEditor,
  registerEditor,
  setActiveEditor,
  unregisterEditor,
} from '../utils/editor-registry'

describe('editor registry', () => {
  afterEach(() => {
    clearEditorRegistry()
  })

  it('returns null when no editor is registered', () => {
    expect(getEditor()).toBeNull()
    expect(getActiveEditor()).toBeNull()
  })

  it('registers and returns the active editor', () => {
    const first = { id: 1 }
    const second = { id: 2 }

    registerEditor(first)
    registerEditor(second)

    expect(getEditor()).toBe(first)
    expect(getActiveEditor()).toBe(first)

    setActiveEditor(second)
    expect(getActiveEditor()).toBe(second)
    expect(getEditor()).toBe(second)
  })

  it('falls back to the last registered editor when the active one is removed', () => {
    const first = { id: 1 }
    const second = { id: 2 }

    registerEditor(first)
    registerEditor(second)
    setActiveEditor(second)
    unregisterEditor(second)

    expect(getActiveEditor()).toBe(first)
    expect(getEditor()).toBe(first)
  })

  it('ignores invalid input', () => {
    registerEditor(null)
    setActiveEditor(null)
    unregisterEditor(null)

    expect(getEditor()).toBeNull()
  })
})
