import { describe, expect, it, afterEach } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { insertBlock, createColumnList } from '../utils/block-insert'
import { Column, ColumnList } from '../extensions/ColumnList.js'

describe('column list', () => {
  let editor = null

  afterEach(() => {
    editor?.destroy?.()
    editor = null
  })

  it('defines column and columnList nodes', () => {
    expect(Column.name).toBe('column')
    expect(ColumnList.name).toBe('columnList')
  })

  it('creates a column list with the requested number of columns', () => {
    expect(createColumnList(2).content).toHaveLength(2)
    expect(createColumnList(3).content).toHaveLength(3)
    expect(createColumnList(9).content).toHaveLength(5)
  })

  it('inserts a two column block into the document', () => {
    editor = new Editor({
      extensions: [StarterKit, ColumnList, Column],
      content: '<p>hello</p>',
    })

    expect(insertBlock(editor, 'column2')).toBe(true)
    expect(editor.getHTML()).toContain('data-type="columnList"')
    expect(editor.getHTML()).toContain('data-type="column"')
  })
})
