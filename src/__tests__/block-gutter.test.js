import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  BLOCK_GUTTER,
  getDragHandleOffset,
  locateBlockControls,
  readGutterTokens,
  resolveBlockRect,
} from '../utils/block-gutter'

const readCss = () => fs.readFileSync(path.resolve(process.cwd(), 'src/styles/variables.css'), 'utf8')

const readStyleFile = (name) => fs
  .readFileSync(path.resolve(process.cwd(), `src/styles/${name}`), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

const readRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match ? match[1] : ''
}

const readCssToken = (css, name) => {
  const match = new RegExp(`${name}:\\s*([0-9.]+)px`).exec(css)
  return match ? Number.parseFloat(match[1]) : NaN
}

const createRect = (overrides = {}) => ({
  top: 100,
  left: 300,
  right: 500,
  bottom: 128,
  width: 200,
  height: 28,
  ...overrides,
})

describe('block gutter tokens', () => {
  it('keeps the JS fallback in sync with variables.css', () => {
    const css = readCss()

    expect(readCssToken(css, '--sky-gutter-width')).toBe(BLOCK_GUTTER.track)
    expect(readCssToken(css, '--sky-block-control-size')).toBe(BLOCK_GUTTER.controlSize)
    expect(readCssToken(css, '--sky-block-control-gap')).toBe(BLOCK_GUTTER.controlGap)
  })

  it('falls back to the constants when no element is available', () => {
    expect(readGutterTokens(null)).toMatchObject({
      track: BLOCK_GUTTER.track,
      controlSize: BLOCK_GUTTER.controlSize,
      controlGap: BLOCK_GUTTER.controlGap,
    })
  })

  it('keeps the gutter track inside the editable area', () => {
    const editorCss = readStyleFile('editor.css')
    const baseCss = readStyleFile('base.css')

    // 轨道必须属于 ProseMirror 的盒子：否则移入轨道会触发 mouseleave，
    // 「+」号与拖拽手柄在点击之前就消失了。
    expect(readRuleBody(editorCss, '.sky-editor .ProseMirror')).toContain('padding-left: var(--sky-gutter-width)')

    // .sky-editor 的 padding 只能由 editor.css 定义，避免简写覆盖轨道宽度
    expect(readRuleBody(editorCss, '.sky-editor')).toContain('padding: var(--sky-spacing-xl)')
    expect(readRuleBody(baseCss, '.sky-editor')).not.toMatch(/(^|[;\s])padding\s*:/)
  })
})

describe('block gutter geometry', () => {
  it('places the add button, menu anchor and track from one computation', () => {
    const element = { getBoundingClientRect: () => createRect() }
    const view = { dom: null, coordsAtPos: vi.fn() }

    const controls = locateBlockControls(view, { pos: 0, index: 0, element })

    expect(controls.add).toEqual({ top: 100, left: 244 })
    expect(controls.menu).toEqual({
      top: 100,
      left: 244 + BLOCK_GUTTER.controlSize + BLOCK_GUTTER.controlGap,
    })
    expect(controls.track).toEqual({ top: 100, left: 244, width: BLOCK_GUTTER.track, height: 28 })
    expect(view.coordsAtPos).not.toHaveBeenCalled()
  })

  it('falls back to coordsAtPos when the element cannot be measured', () => {
    const view = {
      dom: null,
      coordsAtPos: vi.fn(() => ({ top: 50, left: 80, bottom: 70 })),
    }
    const element = { getBoundingClientRect: () => createRect({ width: 0, height: 0 }) }

    const rect = resolveBlockRect(view, { pos: 4, index: 1, element })

    expect(view.coordsAtPos).toHaveBeenCalledWith(4)
    expect(rect).toEqual({ top: 50, left: 80, right: 80, bottom: 70 })
  })

  it('resolves the element from the view when info has none', () => {
    const element = { nodeType: 1, getBoundingClientRect: () => createRect() }
    const view = { dom: null, nodeDOM: vi.fn(() => element) }

    const controls = locateBlockControls(view, { pos: 6, index: 2 })

    expect(view.nodeDOM).toHaveBeenCalledWith(6)
    expect(controls.add.left).toBe(244)
  })

  it('returns null when no geometry can be resolved', () => {
    expect(locateBlockControls({ dom: null }, { pos: 0, index: 0 })).toBeNull()
  })

  it('never places the menu closer than the viewport margin', () => {
    const element = { getBoundingClientRect: () => createRect({ left: 10 }) }
    const controls = locateBlockControls({ dom: null }, { pos: 0, index: 0, element })

    expect(controls.add.left).toBe(-46)
    expect(controls.menu.left).toBe(BLOCK_GUTTER.minLeft)
  })

  it('derives the drag handle offset from the same module', () => {
    expect(getDragHandleOffset()).toEqual([0, BLOCK_GUTTER.handleGap])
  })
})
