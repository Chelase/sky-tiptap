/**
 * Sky Tiptap - 段落扩展
 *
 * 历史版本这里通过 Vue NodeView 在段落左侧渲染「+」按钮。
 * 现在「+」按钮由块级控件组件（src/components/BlockControls）统一提供，
 * 对所有顶层块生效，因此段落不再需要自定义 NodeView。
 *
 * 保留该扩展与导出，避免破坏既有使用方式。
 */

import Paragraph from '@tiptap/extension-paragraph'

export const CustomParagraph = Paragraph.extend({
  name: 'paragraph',
})

export default CustomParagraph
