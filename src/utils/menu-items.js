/**
 * Sky Tiptap - 菜单条目适配
 *
 * 把「条目注册表」（src/config/toolbar-items.js）适配成工具栏 / 悬浮菜单
 * 可以直接渲染的属性。两个菜单共用这一段映射，避免各自演化。
 */

import { icons } from '../icons'
import { getToolbarItemSpec } from '../config/toolbar-items'

/**
 * 把单个条目 key 适配成渲染属性
 * @param {string} key 条目 key
 * @param {Object} editor Tiptap editor 实例
 * @returns {Object|null}
 */
export const resolveMenuItem = (key, editor) => {
  const spec = getToolbarItemSpec(key)

  if (!spec) {
    return null
  }

  return {
    key,
    iconSvg: spec.icon ? icons[spec.icon] : '',
    label: spec.label || '',
    tooltip: spec.tooltip || '',
    isActive: spec.isActive ? spec.isActive(editor) : false,
    disabled: spec.disabled ? spec.disabled(editor) : false,
    run: () => spec.run?.(editor),
  }
}

/**
 * 把菜单配置适配成分组后的渲染属性
 *
 * 兼容两种配置形状：
 * - { groups: [{ name?, items: [key] }] }
 * - { items: [key] }
 *
 * @param {Object} config 菜单配置（defaultToolbarConfig / defaultBubbleMenuConfig）
 * @param {Object} editor Tiptap editor 实例
 * @returns {Array} [{ name, items }]
 */
export const resolveMenuGroups = (config, editor) => {
  const source = config?.groups
    || (config?.items ? [{ items: config.items }] : [])

  return source
    .map((group) => ({
      name: group.name || '',
      items: (group.items || [])
        .map((key) => resolveMenuItem(key, editor))
        .filter(Boolean),
    }))
    .filter((group) => group.items.length > 0)
}
