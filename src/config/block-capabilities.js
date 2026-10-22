/**
 * Sky Tiptap - 块能力配置
 *
 * 参考 Notion 的块级能力集合（canDrag / canSelect / showHoverMenu /
 * canDropOnto / canDropLeftRight 等），用配置决定每种块在编辑器中的交互能力。
 */

/** 默认块能力 */
export const defaultBlockCapabilities = {
  paragraph: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  heading: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  blockquote: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  bulletList: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  orderedList: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  listItem: { canDrag: false, canSelect: true, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  codeBlock: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  table: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: false },
  tableRow: { canDrag: false, canSelect: true, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  tableCell: { canDrag: false, canSelect: true, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  tableHeader: { canDrag: false, canSelect: true, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  image: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  videoEmbed: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  iframe: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  horizontalRule: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: true },
  column: { canDrag: false, canSelect: true, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  columnList: { canDrag: true, canSelect: true, showHoverMenu: true, canDropOnto: true, canDropLeftRight: false },
  aiLoading: { canDrag: false, canSelect: false, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  doc: { canDrag: false, canSelect: false, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
  text: { canDrag: false, canSelect: false, showHoverMenu: false, canDropOnto: false, canDropLeftRight: false },
}

/** 兜底能力：未登记的块类型按可拖拽、可选、可显示悬浮菜单处理 */
export const fallbackBlockCapabilities = {
  canDrag: true,
  canSelect: true,
  showHoverMenu: true,
  canDropOnto: true,
  canDropLeftRight: true,
}

/**
 * 获取块能力
 *
 * @param {string} nodeName 节点类型名
 * @param {Object} [overrides] 覆盖配置，形如 { paragraph: { canDrag: false } }
 * @returns {Object} 能力集合
 */
export const getBlockCapabilities = (nodeName, overrides = {}) => {
  const base = defaultBlockCapabilities[nodeName] || fallbackBlockCapabilities
  const override = overrides?.[nodeName] || {}

  return {
    ...base,
    ...override,
  }
}

/**
 * 判断节点是否可拖拽
 * @param {Object} node ProseMirror 节点
 * @param {Object} [overrides] 覆盖配置
 * @returns {boolean}
 */
export const canDragNode = (node, overrides = {}) => {
  if (!node?.type?.name) {
    return false
  }

  return getBlockCapabilities(node.type.name, overrides).canDrag === true
}
