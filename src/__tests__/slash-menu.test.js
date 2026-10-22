import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { parseSlashCommand, getTextBeforeCursor } from '../utils/slash-menu'

describe('slash menu', () => {
  it('parses a slash command without whitespace', () => {
    expect(parseSlashCommand('/')).toEqual({ query: '' })
    expect(parseSlashCommand('/tab')).toEqual({ query: 'tab' })
    expect(parseSlashCommand('/表格')).toEqual({ query: '表格' })
  })

  it('rejects text that is not a slash command', () => {
    expect(parseSlashCommand('hello')).toBeNull()
    expect(parseSlashCommand('/tab extra')).toBeNull()
    expect(parseSlashCommand('a/')).toBeNull()
    expect(parseSlashCommand('')).toBeNull()
    expect(parseSlashCommand(null)).toBeNull()
  })

  it('reads the text before the cursor inside the current block', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>hello</p>',
    })

    editor.commands.setTextSelection(6)
    expect(getTextBeforeCursor(editor)).toBe('hello')

    editor.commands.insertContent('/tab')
    expect(getTextBeforeCursor(editor)).toBe('hello/tab')

    editor.destroy()
  })
})
