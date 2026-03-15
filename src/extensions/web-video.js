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

  addCommands() {
    return {
      setBilibiliVideo: (options) => ({ commands }) => {
        const { src } = options
        let videoSrc = src

        // 提取 BV 号
        const bvMatch = src.match(/(BV[a-zA-Z0-9]+)/)
        if (bvMatch) {
          videoSrc = `//player.bilibili.com/player.html?bvid=${bvMatch[1]}&page=1&high_quality=1&danmaku=0`
        }

        return commands.insertContent({
          type: this.name,
          attrs: { src: videoSrc },
        })
      },
      setYoutubeVideo: (options) => ({ commands }) => {
        const { src } = options
        let videoSrc = src

        // 提取 YouTube ID
        const ytMatch = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        if (ytMatch) {
          videoSrc = `https://www.youtube.com/embed/${ytMatch[1]}`
        }

        return commands.insertContent({
          type: this.name,
          attrs: { src: videoSrc },
        })
      },
      setTiktokVideo: (options) => ({ commands }) => {
        // 抖音视频嵌入逻辑需要根据具体情况调整，这里暂时直接使用链接
        // 注意：抖音网页版通常不支持直接 iframe 嵌入，可能需要使用 embed code 或 api
        return commands.insertContent({
          type: this.name,
          attrs: { src: options.src },
        })
      }
    }
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
