/**
 * Sky Tiptap - 块级控件几何
 *
 * 唯一拥有「+ 号 / 块菜单锚点 / 拖拽手柄该出现在哪」的模块。
 *
 * 视觉令牌以 src/styles/variables.css 为准，JS 只负责读取、并在拿不到时
 * 用 BLOCK_GUTTER 兜底；两者的一致性由 __tests__/block-gutter.test.js 守护。
 */

import { resolveBlockElement } from './block-controls'

/** 兜底令牌：必须与 src/styles/variables.css 中的对应变量保持一致 */
export const BLOCK_GUTTER = Object.freeze({
  /** 左侧轨道宽度 */
  track: 56,
  /** 控件尺寸（+ 号） */
  controlSize: 24,
  /** 控件与内容的间距 */
  controlGap: 8,
  /** 拖拽手柄与内容左边缘的距离（tippy distance） */
  handleGap: 4,
  /** 菜单锚点的最小左边距，避免贴住视口 */
  minLeft: 8,
})

/** 令牌字段 ↔ CSS 变量名 */
const GUTTER_TOKENS = {
  track: '--sky-gutter-width',
  controlSize: '--sky-block-control-size',
  controlGap: '--sky-block-control-gap',
}

const readToken = (styles, name, fallback) => {
  if (!styles || typeof styles.getPropertyValue !== 'function') {
    return fallback
  }

  const parsed = Number.parseFloat(styles.getPropertyValue(name))

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * 读取块级几何令牌
 * @param {Element} [element] 解析 CSS 变量的元素（通常是编辑器根节点）
 * @returns {{ track: number, controlSize: number, controlGap: number, handleGap: number, minLeft: number }}
 */
export const readGutterTokens = (element) => {
  const styles = element && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
    ? window.getComputedStyle(element)
    : null

  return {
    track: readToken(styles, GUTTER_TOKENS.track, BLOCK_GUTTER.track),
    controlSize: readToken(styles, GUTTER_TOKENS.controlSize, BLOCK_GUTTER.controlSize),
    controlGap: readToken(styles, GUTTER_TOKENS.controlGap, BLOCK_GUTTER.controlGap),
    handleGap: BLOCK_GUTTER.handleGap,
    minLeft: BLOCK_GUTTER.minLeft,
  }
}

/**
 * 解析块元素的视口矩形
 *
 * 元素矩形优先；元素不可测（例如 NodeView 尚未渲染）时退回 coordsAtPos。
 *
 * @param {Object} view ProseMirror EditorView
 * @param {Object} info { element?, pos, index }
 * @returns {{ top: number, left: number, right: number, bottom: number }|null}
 */
export const resolveBlockRect = (view, info) => {
  const element = info?.element || resolveBlockElement(view, info?.pos, info?.index)

  if (element && typeof element.getBoundingClientRect === 'function') {
    const rect = element.getBoundingClientRect()
    if (rect && (rect.width || rect.height)) {
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      }
    }
  }

  if (view && typeof view.coordsAtPos === 'function') {
    const coords = view.coordsAtPos(info?.pos ?? 0)
    if (coords) {
      return {
        top: coords.top,
        left: coords.left,
        right: coords.left,
        bottom: coords.bottom,
      }
    }
  }

  return null
}

/**
 * 计算块级控件的全部锚点
 *
 * add：+ 号左上角
 * menu：块菜单左上角（贴在 + 号右侧）
 * track：整条左侧轨道的矩形
 *
 * @param {Object} view ProseMirror EditorView
 * @param {Object} info { element?, pos, index }
 * @returns {{ tokens: Object, rect: Object, add: Object, menu: Object, track: Object }|null}
 */
export const locateBlockControls = (view, info) => {
  const rect = resolveBlockRect(view, info)
  if (!rect) {
    return null
  }

  const tokens = readGutterTokens(view?.dom)
  const top = Math.round(rect.top)
  const trackLeft = Math.round(rect.left - tokens.track)

  return {
    tokens,
    rect,
    add: { top, left: trackLeft },
    menu: {
      top,
      left: Math.max(
        tokens.minLeft,
        trackLeft + Math.round(tokens.controlSize + tokens.controlGap),
      ),
    },
    track: {
      top,
      left: trackLeft,
      width: tokens.track,
      height: Math.max(0, Math.round(rect.bottom - rect.top)),
    },
  }
}

/**
 * 拖拽手柄的 tippy offset
 *
 * 从同一组令牌派生，避免与「+」号各自维护一个数字。
 * @param {Element} [element]
 * @returns {[number, number]}
 */
export const getDragHandleOffset = (element) => {
  const tokens = readGutterTokens(element)

  return [0, tokens.handleGap]
}
