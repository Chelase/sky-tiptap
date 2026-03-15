/**
 * Sky Tiptap - Default Configuration
 * 默认配置
 */

import { VueNodeViewRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
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
      heading: false,   // 禁用标题功能（根据需求）
      paragraph: false, // 禁用默认段落，使用自定义段落
    }),
    Highlight,
    Typography,
    Image,
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
  editorProps: {
    attributes: {
      spellcheck: 'false',
      class: 'sky-prosemirror',
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
