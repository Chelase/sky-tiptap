/**
 * Sky Tiptap - 块目录配置
 *
 * 「+」按钮与「/」快捷键共用的可搜索块目录。
 * 结构参考 Notion 的块添加菜单（add menu）：分组展示 + 关键字过滤。
 */

/** 菜单分组 */
export const INSERT_MENU_GROUPS = [
  { id: 'basic', title: '基础' },
  { id: 'list', title: '列表' },
  { id: 'media', title: '媒体与嵌入' },
  { id: 'advanced', title: '高级' },
]

/** 默认块目录 */
export const defaultInsertMenuItems = [
  {
    type: 'text',
    label: '文本',
    icon: 'text',
    group: 'basic',
    keywords: ['text', '正文', '段落', 'plain'],
  },
  {
    type: 'heading1',
    label: '一级标题',
    icon: 'heading1',
    group: 'basic',
    keywords: ['h1', 'heading1', '标题', 'title'],
  },
  {
    type: 'heading2',
    label: '二级标题',
    icon: 'heading2',
    group: 'basic',
    keywords: ['h2', 'heading2', '标题', 'subtitle'],
  },
  {
    type: 'heading3',
    label: '三级标题',
    icon: 'heading3',
    group: 'basic',
    keywords: ['h3', 'heading3', '标题'],
  },
  {
    type: 'quote',
    label: '引用',
    icon: 'quote',
    group: 'basic',
    keywords: ['quote', '引用', 'blockquote'],
  },
  {
    type: 'divider',
    label: '分割线',
    icon: 'divider',
    group: 'basic',
    keywords: ['divider', 'hr', '分割线', 'line'],
  },
  {
    type: 'bulletList',
    label: '无序列表',
    icon: 'bulletList',
    group: 'list',
    keywords: ['bullet', '无序', '列表', 'list'],
  },
  {
    type: 'orderedList',
    label: '有序列表',
    icon: 'orderedList',
    group: 'list',
    keywords: ['ordered', '有序', '列表', 'number'],
  },
  {
    type: 'image',
    label: '图片',
    icon: 'image',
    group: 'media',
    keywords: ['image', '图片', 'photo'],
  },
  {
    type: 'video',
    label: '视频',
    icon: 'video',
    group: 'media',
    keywords: ['video', '视频', 'movie'],
  },
  {
    type: 'embed',
    label: '嵌入网站',
    icon: 'website',
    group: 'media',
    keywords: ['embed', 'website', '网站', '嵌入', 'iframe'],
  },
  {
    type: 'codeBlock',
    label: '代码块',
    icon: 'code',
    group: 'advanced',
    keywords: ['code', '代码', 'snippet'],
  },
  {
    type: 'table',
    label: '表格',
    icon: 'table',
    group: 'advanced',
    keywords: ['table', '表格', 'grid'],
  },
  {
    type: 'column2',
    label: '两列',
    icon: 'columns',
    group: 'advanced',
    keywords: ['column', 'columns', '两列', '分栏', '布局'],
  },
  {
    type: 'column3',
    label: '三列',
    icon: 'columns',
    group: 'advanced',
    keywords: ['column', 'columns', '三列', '分栏', '布局'],
  },
  {
    type: 'ai',
    label: 'AI 生成',
    icon: 'ai',
    group: 'advanced',
    keywords: ['ai', '智能', '生成', 'gpt'],
  },
]

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
