/**
 * Sky Tiptap - 块目录视图
 *
 * 块的类型知识在 src/config/block-catalog.js，本文件只负责把它
 * 投影成菜单需要的形状（分组展示 + 关键字过滤），以及维持
 * `insertMenuItems` prop 的历史契约。
 */

import { listBlockEntries } from './block-catalog'

/** 菜单分组 */
export const INSERT_MENU_GROUPS = [
  { id: 'basic', title: '基础' },
  { id: 'list', title: '列表' },
  { id: 'media', title: '媒体与嵌入' },
  { id: 'advanced', title: '高级' },
]

/** 菜单条目的公开形状（与 `insertMenuItems` prop 一致） */
const toMenuItem = ({ type, label, icon, group, keywords }) => ({
  type,
  label,
  icon,
  group,
  keywords,
})

/** 默认块目录：由 block-catalog 派生，顺序即菜单默认顺序 */
export const defaultInsertMenuItems = listBlockEntries().map(toMenuItem)

/**
 * 按关键字过滤块目录
 * @param {Array} items 块目录
 * @param {string} query 搜索词
 * @returns {Array}
 */
export const filterInsertMenuItems = (items, query) => {
  const list = Array.isArray(items) ? items : []
  const keyword = String(query || '').trim().toLowerCase()

  if (!keyword) {
    return list
  }

  return list.filter((item) => {
    const haystack = [item?.label, item?.type, ...(Array.isArray(item?.keywords) ? item.keywords : [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
}

/**
 * 把块目录按分组整理
 * @param {Array} items 块目录
 * @param {Array} groups 分组定义
 * @returns {Array} [{ group, title, items }]
 */
export const groupInsertMenuItems = (items, groups = INSERT_MENU_GROUPS) => {
  const list = Array.isArray(items) ? items : []
  const result = []

  groups.forEach((group) => {
    const groupItems = list.filter((item) => item?.group === group.id)
    if (groupItems.length) {
      result.push({ group: group.id, title: group.title, items: groupItems })
    }
  })

  // 未登记到任何分组的条目统一放到最后
  const rest = list.filter((item) => !groups.some((group) => group.id === item?.group))
  if (rest.length) {
    result.push({ group: 'other', title: '其他', items: rest })
  }

  return result
}
