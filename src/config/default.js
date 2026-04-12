/**
 * Sky Tiptap - Default Configuration
 * 默认配置
 */

import { VueNodeViewRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { all, createLowlight } from 'lowlight'

import CodeBlockComponent from '../components/NodeView/CodeBlock.vue'
import VideoEmbed from '../extensions/web-video.js'
import Iframe from '../extensions/iframe.js'
import { CustomParagraph } from '../extensions/CustomParagraph.js'

const lowlight = createLowlight(all)

export const TipTapPlugin = {
  // 注册配置插件
  extensions: [
    StarterKit.configure({
      codeBlock: false, // 禁用 StarterKit 中的 codeBlock
      heading: {
        levels: [1, 2, 3]
      },
      paragraph: false, // 禁用默认段落，使用自定义段落
      codeBlockHighlight: false,
    }),
    Highlight,
    Typography,
    Image,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'sky-link'
      }
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    CodeBlockLowlight
      .extend({
        addNodeView() {
          return VueNodeViewRenderer(CodeBlockComponent)
        },
      })
      .configure({ lowlight }),
    Youtube.configure({
      controls: false,
      nocookie: true,
    }),
    VideoEmbed,
    Iframe,
    CustomParagraph,
  ],
  // 设置初始内容
  content: '<p></p>',
  // 初始化后将光标放置在编辑器中
  autofocus: 'end',
  // 使文本可编辑
  editable: true,
  // 是否禁用默认 css 的加载
  injectCSS: true,
  // 粘贴规则
  enablePasteRules: true,
  // 启用输入规则（Markdown 语法支持）
  enableInputRules: true,
  editorProps: {
    attributes: {
      spellcheck: 'false',
      class: 'sky-prosemirror',
    },
    handleClick: (view, pos, event) => {
      const link = event.target.closest('a')
      if (link && (event.ctrlKey || event.metaKey)) {
        const href = link.getAttribute('href')
        if (href) {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
        return true
      }
    },
  },
}

/**
 * 默认工具栏配置
 */
export const defaultToolbarConfig = {
  groups: [
    {
      name: 'history',
      items: ['undo', 'redo']
    },
    {
      name: 'format',
      items: ['bold', 'italic', 'underline', 'strike']
    },
    {
      name: 'list',
      items: ['bulletList', 'orderedList']
    },
    {
      name: 'insert',
      items: ['image', 'video', 'codeBlock', 'table', 'divider', 'link']
    },
    {
      name: 'ai',
      items: ['ai']
    }
  ]
}

/**
 * 默认悬浮菜单配置
 */
export const defaultBubbleMenuConfig = {
  items: ['bold', 'italic', 'underline', 'strike', 'link']
}
