import { describe, expect, it, afterEach } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import {
  duplicateBlock,
  findCurrentTopLevelBlock,
  moveBlock,
  selectBlock,
} from '../utils/block-actions'

const createEditor = (content) => new Editor({
  extensions: [StarterKit],
  content,
})

const textOf = (editor) => editor.getText().replace(/\n+/g, '|')

describe('block actions', () => {
  let editor = null

  afterEach(() => {
    editor?.destroy?.()
    editor = null
  })

  it('finds the top level block that owns the selection', () => {
    editor = createEditor('<p>first</p><p>second</p>')
    editor.commands.setTextSelection(2)

    const info = findCurrentTopLevelBlock(editor)

    expect(info).toBeTruthy()
    expect(info.index).toBe(0)
    expect(info.node.type.name).toBe('paragraph')
  })

  it('moves a block down', () => {
    editor = createEditor('<p>first</p><p>second</p>')
    editor.commands.setTextSelection(2)

    expect(moveBlock(editor, 'down')).toBe(true)
    expect(textOf(editor)).toBe('second|first')
  })

  it('moves a block up', () => {
    editor = createEditor('<p>first</p><p>second</p>')
    editor.commands.setTextSelection(8)

    expect(moveBlock(editor, 'up')).toBe(true)
    expect(textOf(editor)).toBe('second|first')
  })

  it('does not move a block beyond the document bounds', () => {
    editor = createEditor('<p>first</p><p>second</p>')
    editor.commands.setTextSelection(2)

    expect(moveBlock(editor, 'up')).toBe(false)
    expect(textOf(editor)).toBe('first|second')
  })

  it('duplicates the current block', () => {
    editor = createEditor('<p>first</p>')
    editor.commands.setTextSelection(2)

    expect(duplicateBlock(editor)).toBe(true)
    expect(textOf(editor)).toBe('first|first')
  })

  it('selects the current block', () => {
    editor = createEditor('<p>first</p>')
    editor.commands.setTextSelection(2)

    expect(selectBlock(editor)).toBe(true)
    expect(editor.state.selection.constructor.name).toBe('NodeSelection')
  })
})
