// extensions/web-video.js
// 视频嵌入扩展（Bilibili、YouTube 等）

import { Node, mergeAttributes } from '@tiptap/core'

const Video = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 640 },
      height: { default: 360 },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
        getAttrs: (node) => ({
          src: node.getAttribute('src'),
          width: node.getAttribute('width'),
          height: node.getAttribute('height'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement('div')
      div.className = 'sky-video-container'

      const iframe = document.createElement('iframe')
      iframe.src = node.attrs.src
      iframe.width = node.attrs.width
      iframe.height = node.attrs.height
      iframe.allowFullscreen = true
      iframe.frameBorder = '0'

      div.appendChild(iframe)
      return { dom: div }
    }
  },
})

export default Video
