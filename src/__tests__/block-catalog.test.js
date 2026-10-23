import { describe, expect, it, vi } from 'vitest'
import {
  EXTERNAL_BLOCK_TYPES,
  blockCatalog,
  createBlockContent,
  getBlockEntry,
  getBlockShortcut,
  insertBlock,
  listBlockEntries,
  triggerExternalBlock,
} from '../config/block-catalog'
import { defaultInsertMenuItems } from '../config/insert-menu'
import { toolbarItemSpecs } from '../config/toolbar-items'
import { emitter } from '../utils/emitter'

const createChain = (result = true) => {
  const chain = {
    focus: vi.fn(() => chain),
    insertContent: vi.fn(() => chain),
    insertContentAt: vi.fn(() => chain),
    run: vi.fn(() => result),
  }
  return chain
}

describe('block catalog', () => {
  it('declares a complete menu contract for every entry', () => {
    const entries = listBlockEntries()

    expect(entries).toHaveLength(defaultInsertMenuItems.length)

    entries.forEach((entry) => {
      expect(['node', 'request']).toContain(entry.kind)
      expect(entry.label).toBeTruthy()
      expect(entry.icon).toBeTruthy()
      expect(entry.group).toBeTruthy()
      expect(Array.isArray(entry.keywords)).toBe(true)

      if (entry.kind === 'node') {
        expect(typeof entry.create).toBe('function')
      } else {
        expect(entry.request).toBeTruthy()
      }
    })
  })

  it('keeps the insert menu projection in the catalog order', () => {
    expect(defaultInsertMenuItems.map((item) => item.type)).toEqual(Object.keys(blockCatalog))
  })

  it('exposes the same shape the insertMenuItems prop expects', () => {
    defaultInsertMenuItems.forEach((item) => {
      expect(Object.keys(item).sort()).toEqual(['group', 'icon', 'keywords', 'label', 'type'])
    })
  })

  it('exposes markdown shortcuts for the menu hints', () => {
    expect(getBlockShortcut('heading1')).toBe('#')
    expect(getBlockShortcut('heading2')).toBe('##')
    expect(getBlockShortcut('heading3')).toBe('###')
    expect(getBlockShortcut('divider')).toBe('---')
    expect(getBlockShortcut('bulletList')).toBe('-')
    expect(getBlockShortcut('orderedList')).toBe('1.')
    expect(getBlockShortcut('table')).toBe('')
    expect(getBlockShortcut('not-exist')).toBe('')
  })

  it('derives external block types from the request entries', () => {
    const requestTypes = listBlockEntries()
      .filter((entry) => entry.kind === 'request')
      .map((entry) => entry.type)

    expect(EXTERNAL_BLOCK_TYPES).toEqual(requestTypes)
  })

  it('creates content only for node entries', () => {
    listBlockEntries().forEach((entry) => {
      const content = createBlockContent(entry.type)

      if (entry.kind === 'node') {
        expect(content).toBeTruthy()
        expect(typeof content.type).toBe('string')
      } else {
        expect(content).toBeNull()
      }
    })

    expect(createBlockContent('not-exist')).toBeNull()
  })

  it('has exactly one implementation for table', () => {
    const content = createBlockContent('table')

    expect(content.type).toBe('table')
    expect(content.content).toHaveLength(3)
    expect(content.content[0].content[0].type).toBe('tableHeader')

    const chain = createChain()
    expect(insertBlock({ chain: vi.fn(() => chain) }, 'table', { insertAt: 4 })).toBe(true)
    expect(chain.insertContentAt).toHaveBeenCalledWith(4, content)
  })

  it('routes toolbar insert entries through the same path', () => {
    const chain = createChain()
    const editor = { chain: vi.fn(() => chain) }

    toolbarItemSpecs.table.run(editor)

    expect(chain.insertContent).toHaveBeenCalledWith(createBlockContent('table'))
    expect(chain.run).toHaveBeenCalled()
  })

  it('dispatches every request entry to its external flow', () => {
    const events = {
      image: 'trigger-add-image',
      video: 'show-video-menu',
      embed: 'trigger-add-website',
      ai: 'ai-generate',
    }

    Object.entries(events).forEach(([type, event]) => {
      const listener = vi.fn()
      emitter.on(event, listener)

      expect(triggerExternalBlock(type)).toBe(true)
      expect(listener).toHaveBeenCalledTimes(1)

      emitter.off(event, listener)
    })
  })

  it('keeps the legacy ai event name', () => {
    const listener = vi.fn()
    emitter.on('AI-generated', listener)

    insertBlock({ chain: vi.fn() }, 'ai')

    expect(listener).toHaveBeenCalledTimes(1)
    emitter.off('AI-generated', listener)
  })

  it('does not treat unknown or node types as external requests', () => {
    expect(getBlockEntry('not-exist')).toBeNull()
    expect(triggerExternalBlock('not-exist')).toBe(false)
    expect(triggerExternalBlock('table')).toBe(false)
  })
})
