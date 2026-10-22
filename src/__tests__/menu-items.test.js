import { describe, expect, it, vi } from 'vitest'
import { resolveMenuItem, resolveMenuGroups } from '../utils/menu-items'
import { icons } from '../icons'

const createEditor = () => {
  const chain = {
    focus: vi.fn(() => chain),
    toggleBold: vi.fn(() => chain),
    run: vi.fn(() => true),
  }

  return {
    chain: vi.fn(() => chain),
    isActive: vi.fn(() => true),
    can: vi.fn(() => ({ undo: () => false })),
    chainRef: chain,
  }
}

describe('menu item adapter', () => {
  it('maps a registry spec to render props', () => {
    const editor = createEditor()
    const item = resolveMenuItem('bold', editor)

    expect(item.key).toBe('bold')
    expect(item.iconSvg).toBe(icons.bold)
    expect(item.tooltip).toBe('加粗')
    expect(item.isActive).toBe(true)
    expect(item.disabled).toBe(false)
    expect(editor.isActive).toHaveBeenCalledWith('bold')
  })

  it('runs against the editor it was resolved with', () => {
    const editor = createEditor()
    const item = resolveMenuItem('bold', editor)

    item.run()

    expect(editor.chain).toHaveBeenCalled()
    expect(editor.chainRef.toggleBold).toHaveBeenCalled()
    expect(editor.chainRef.run).toHaveBeenCalled()
  })

  it('ignores unknown keys', () => {
    expect(resolveMenuItem('not-exist', createEditor())).toBeNull()
  })

  it('resolves grouped configs and drops unknown or empty groups', () => {
    const groups = resolveMenuGroups(
      {
        groups: [
          { name: 'format', items: ['bold', 'not-exist'] },
          { name: 'empty', items: [] },
          { name: 'missing', items: ['nope'] },
        ],
      },
      createEditor(),
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('format')
    expect(groups[0].items.map((item) => item.key)).toEqual(['bold'])
  })

  it('supports the flat items shape used by bubble menu configs', () => {
    const groups = resolveMenuGroups({ items: ['bold', 'italic'] }, createEditor())

    expect(groups).toHaveLength(1)
    expect(groups[0].items.map((item) => item.key)).toEqual(['bold', 'italic'])
  })

  it('returns an empty list for missing configs', () => {
    expect(resolveMenuGroups(undefined, createEditor())).toEqual([])
  })
})
