/**
 * Sky Tiptap - 块级控件定位工具
 *
 * 负责「+」按钮、拖拽手柄这类块级悬浮控件的定位计算，
 * 逻辑保持纯函数，方便单测覆盖。
 */

/** 默认控件参数 */
export const DEFAULT_BLOCK_CONTROL_OPTIONS = {
  /** 左侧轨道宽度（按钮距内容左边缘的距离） */
  gutterWidth: 56,
  /** 控件尺寸 */
  controlSize: 24,
  /** 控件与内容的间距 */
  gutterGap: 8,
  /** 与块顶部的偏移 */
  offsetY: 0,
}

/**
 * 获取文档中第 index 个顶层子节点的起始位置
 * @param {Object} doc ProseMirror 文档节点
 * @param {number} index 顶层子节点下标
 * @returns {number} 起始位置
 */
export const getChildStart = (doc, index) => {
  if (!doc || index <= 0) {
    return 0
  }

  let pos = 0
  for (let i = 0; i < index; i += 1) {
    pos += doc.child(i).nodeSize
  }

  return pos
}

/**
 * 安全调用 posAtCoords（部分环境不支持坐标命中）
 * @param {Object} view ProseMirror EditorView
 * @param {Object} coords 视口坐标
 * @returns {Object|null}
 */
const safePosAtCoords = (view, coords) => {
  try {
    return view.posAtCoords(coords) || null
  } catch (error) {
    return null
  }
}

/**
 * 找到坐标命中的顶层块
 *
 * @param {Object} view ProseMirror EditorView
 * @param {Object} coords 视口坐标 { left, top }
 * @returns {Object|null} { pos, end, node, index, element }
 */
export const findTopLevelBlock = (view, coords) => {
  if (!view || typeof view.posAtCoords !== 'function' || !coords) {
    return null
  }

  const hit = safePosAtCoords(view, coords)
  if (!hit || typeof hit.pos !== 'number') {
    return null
  }

  const { doc } = view.state
  if (!doc || !doc.childCount) {
    return null
  }

  const $pos = doc.resolve(hit.pos)

  let index
  let pos
  let node

  if ($pos.depth >= 1) {
    node = $pos.node(1)
    pos = $pos.before(1)
    index = doc.resolve(pos).index(0)
  } else {
    // 光标落在块与块之间，取紧随其后的块（末尾则取最后一块）
    index = Math.min($pos.index(0), doc.childCount - 1)
    node = doc.child(index)
    pos = getChildStart(doc, index)
  }

  if (!node) {
    return null
  }

  return {
    pos,
    end: pos + node.nodeSize,
    node,
    index,
    element: resolveBlockElement(view, pos, index),
  }
}

/**
 * 解析顶层块对应的 DOM 元素
 * @param {Object} view ProseMirror EditorView
 * @param {number} pos 块起始位置
 * @param {number} index 顶层下标
 * @returns {Element|null}
 */
export const resolveBlockElement = (view, pos, index) => {
  if (!view) {
    return null
  }

  if (typeof view.nodeDOM === 'function') {
    const dom = view.nodeDOM(pos)
    if (dom && dom.nodeType === 1) {
      return dom
    }
  }

  const children = view.dom?.children
  if (children && children[index]) {
    return children[index]
  }

  return null
}

/**
 * 计算块级控件的位置
 *
 * @param {Object} rect 块元素的视口矩形
 * @param {Object} [options] 控件参数
 * @returns {Object} { top, left }
 */
export const getBlockControlPosition = (rect, options = {}) => {
  const settings = { ...DEFAULT_BLOCK_CONTROL_OPTIONS, ...options }

  if (!rect) {
    return { top: 0, left: 0 }
  }

  return {
    top: Math.round(rect.top + settings.offsetY),
    left: Math.round(rect.left - settings.gutterWidth),
  }
}

/**
 * 命中测试：坐标是否落在块元素内
 * @param {Object} rect 块元素矩形
 * @param {Object} coords 视口坐标
 * @returns {boolean}
 */
export const isPointInRect = (rect, coords) => {
  if (!rect || !coords) {
    return false
  }

  return (
    coords.left >= rect.left &&
    coords.left <= rect.right &&
    coords.top >= rect.top &&
    coords.top <= rect.bottom
  )
}
