import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  createBlockContent,
  createHeading,
  createList,
  createParagraph,
  createQuote,
  createTable,
  insertBlock,
  EXTERNAL_BLOCK_TYPES,
} from '../utils/block-insert'
import {
  defaultInsertMenuItems,
  filterInsertMenuItems,
  groupInsertMenuItems,
  INSERT_MENU_GROUPS,
} from '../config/insert-menu'
import { emitter } from '../utils/emitter'

describe('block insert', () => {
  it('creates block content for every catalog type', () => {
    defaultInsertMenuItems.forEach((item) => {
      if (EXTERNAL_BLOCK_TYPES.includes(item.type)) {
        expect(createBlockContent(item.type)).toBeNull()
        return
      }

      expect(createBlockContent(item.type)).toBeTruthy()
    })
  })

  it('creates paragraph, heading, list, quote and table nodes', () => {
    expect(createParagraph()).toEqual({ type: 'paragraph', content: [] })
    expect(createHeading(2)).toEqual({ type: 'heading', attrs: { level: 2 }, content: [] })
    expect(createList('bulletList').type).toBe('bulletList')
    expect(createQuote().type).toBe('blockquote')
    expect(createTable(2, 2).content).toHaveLength(2)
    expect(createTable(2, 2).content[0].content).toHaveLength(2)
    expect(createTable(2, 2).content[0].content[0].type).toBe('tableHeader')
  })

  it('inserts a block at the given position', () => {
    const run = vi.fn(() => true)
    const chain = {
      focus: vi.fn(() => chain),
      insertContentAt: vi.fn(() => chain),
      insertContent: vi.fn(() => chain),
      run,
    }
    const editor = { chain: vi.fn(() => chain) }

    expect(insertBlock(editor, 'heading1', { insertAt: 12 })).toBe(true)
    expect(chain.insertContentAt).toHaveBeenCalledWith(12, expect.objectContaining({ type: 'heading' }))
    expect(run).toHaveBeenCalled()
  })

  it('inserts at the current selection when no position is given', () => {
    const chain = {
      focus: vi.fn(() => chain),
      insertContentAt: vi.fn(() => chain),
      insertContent: vi.fn(() => chain),
      run: vi.fn(() => true),
    }
    const editor = { chain: vi.fn(() => chain) }

    expect(insertBlock(editor, 'text')).toBe(true)
    expect(chain.insertContent).toHaveBeenCalled()
    expect(chain.insertContentAt).not.toHaveBeenCalled()
  })

  it('returns false for unknown block types', () => {
    const editor = { chain: vi.fn() }
    expect(insertBlock(editor, 'not-exist')).toBe(false)
    expect(insertBlock(null, 'text')).toBe(false)
  })

  it('routes external block types through the emitter', () => {
    const listener = vi.fn()
    emitter.on('trigger-add-image', listener)

    expect(insertBlock({ chain: vi.fn() }, 'image')).toBe(true)
    expect(listener).toHaveBeenCalled()

    emitter.off('trigger-add-image', listener)
  })
})

describe('insert menu catalog', () => {
  it('exposes unique block types', () => {
    const types = defaultInsertMenuItems.map((item) => item.type)
    expect(new Set(types).size).toBe(types.length)
  })

  it('filters items by label, type and keywords', () => {
    expect(filterInsertMenuItems(defaultInsertMenuItems, '标题').length).toBeGreaterThan(0)
    expect(filterInsertMenuItems(defaultInsertMenuItems, 'video').map((item) => item.type)).toContain('video')
    expect(filterInsertMenuItems(defaultInsertMenuItems, '')).toHaveLength(defaultInsertMenuItems.length)
    expect(filterInsertMenuItems(defaultInsertMenuItems, '不存在的操作')).toHaveLength(0)
  })

  it('groups items and keeps unknown groups at the end', () => {
    const groups = groupInsertMenuItems(defaultInsertMenuItems, INSERT_MENU_GROUPS)
    const ids = groups.map((group) => group.group)

    expect(ids).not.toContain('other')
    expect(groups.reduce((total, group) => total + group.items.length, 0)).toBe(defaultInsertMenuItems.length)

    const withRest = groupInsertMenuItems([...defaultInsertMenuItems, { type: 'x', label: 'X', group: 'unknown' }], INSERT_MENU_GROUPS)
    expect(withRest[withRest.length - 1].group).toBe('other')
  })
})
