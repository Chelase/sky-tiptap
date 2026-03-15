// extensions/iframe.js
// iframe 嵌入扩展

import { Node } from '@tiptap/core'

const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 640 },
      height: { default: 360 },
      frameborder: { default: '0' },
      allowfullscreen: { default: 'true' },
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
          frameborder: node.getAttribute('frameborder'),
          allowfullscreen: node.getAttribute('allowfullscreen'),
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'iframe',
      {
        src: node.attrs.src,
        width: node.attrs.width,
        height: node.attrs.height,
        frameborder: node.attrs.frameborder,
        allowfullscreen: node.attrs.allowfullscreen,
      },
    ]
  },

  addCommands() {
    return {
      setIframe: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement('div')
      div.className = 'sky-iframe-container'

      const iframe = document.createElement('iframe')
      iframe.src = node.attrs.src
      iframe.width = node.attrs.width
      iframe.height = node.attrs.height
      iframe.frameBorder = node.attrs.frameborder
      iframe.allowFullscreen = node.attrs.allowfullscreen

      div.appendChild(iframe)
      return { dom: div }
    }
  },
})

export default Iframe
