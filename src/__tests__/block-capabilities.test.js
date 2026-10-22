import { describe, expect, it } from 'vitest'
import {
  canDragNode,
  defaultBlockCapabilities,
  getBlockCapabilities,
} from '../config/block-capabilities'
import { getToolbarItemSpec, toolbarItemSpecs } from '../config/toolbar-items'
import { defaultBubbleMenuConfig, defaultToolbarConfig } from '../config/menu-config'

describe('block capabilities', () => {
  it('provides a default capability set for known blocks', () => {
    expect(getBlockCapabilities('paragraph').canDrag).toBe(true)
    expect(getBlockCapabilities('paragraph').showHoverMenu).toBe(true)
    expect(getBlockCapabilities('tableRow').showHoverMenu).toBe(false)
    expect(getBlockCapabilities('aiLoading').canDrag).toBe(false)
  })

  it('falls back to a draggable capability for unknown blocks', () => {
    expect(getBlockCapabilities('unknownBlock').canDrag).toBe(true)
    expect(getBlockCapabilities('unknownBlock').showHoverMenu).toBe(true)
  })

  it('supports overrides', () => {
    const overrides = { paragraph: { canDrag: false } }
    const capabilities = getBlockCapabilities('paragraph', overrides)

    expect(capabilities.canDrag).toBe(false)
    expect(capabilities.showHoverMenu).toBe(true)
  })

  it('checks node draggability', () => {
    expect(canDragNode({ type: { name: 'paragraph' } })).toBe(true)
    expect(canDragNode({ type: { name: 'listItem' } })).toBe(false)
    expect(canDragNode(null)).toBe(false)
    expect(canDragNode({ type: { name: 'paragraph' } }, { paragraph: { canDrag: false } })).toBe(false)
  })

  it('registers a capability set for every interactive block type', () => {
    expect(Object.keys(defaultBlockCapabilities).length).toBeGreaterThan(10)
  })
})

describe('toolbar item registry', () => {
  it('defines every item referenced by the toolbar and bubble menu configs', () => {
    const keys = [
      ...defaultToolbarConfig.groups.flatMap((group) => group.items),
      ...defaultBubbleMenuConfig.items,
    ]

    keys.forEach((key) => {
      expect(toolbarItemSpecs[key]).toBeDefined()
      expect(getToolbarItemSpec(key)).toBe(toolbarItemSpecs[key])
    })
  })

  it('returns null for unknown items', () => {
    expect(getToolbarItemSpec('not-exist')).toBeNull()
  })

  it('exposes run handlers for every item', () => {
    Object.values(toolbarItemSpecs).forEach((spec) => {
      expect(typeof spec.run).toBe('function')
    })
  })
})
