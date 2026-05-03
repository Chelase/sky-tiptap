// extensions/web-video.js
// 视频嵌入扩展（Bilibili、YouTube、抖音等）

import { Node, mergeAttributes } from '@tiptap/core'

export const extractBilibiliVideoId = (src = '') => {
  const input = String(src).trim()
  const match = input.match(/(BV[a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export const extractYoutubeVideoId = (src = '') => {
  const input = String(src).trim()

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  const match = input.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match ? match[1] : null
}

export const extractDouyinVideoId = (src = '') => {
  const input = String(src).trim()
  if (!input) return null

  if (/^\d{10,}$/.test(input)) {
    return input
  }

  const patterns = [
    /open\.douyin\.com\/player\/video\?[^#\s]*\bvid=([0-9]+)/i,
    /douyin\.com\/video\/([0-9]+)/i,
    /douyin\.com\/note\/([0-9]+)/i,
    /iesdouyin\.com\/share\/video\/([0-9]+)/i,
    /[?&](?:modal_id|video_id|vid)=([0-9]+)/i,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }

  return null
}

export const createDouyinPlayerSrc = (videoId) => {
  return `https://open.douyin.com/player/video?vid=${videoId}&autoplay=0`
}

const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      type: { default: 'iframe' },
      width: { default: 640 },
      height: { default: 360 },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
        getAttrs: (node) => ({
          src: node.getAttribute('data-src'),
          type: node.getAttribute('data-type') || 'iframe',
          width: node.getAttribute('data-width'),
          height: node.getAttribute('data-height'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-video-embed': '' }, HTMLAttributes)]
  },

  addCommands() {
    return {
      setBilibiliVideo: (options) => ({ commands }) => {
        const videoId = extractBilibiliVideoId(options.src)
        if (!videoId) return false

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: `//player.bilibili.com/player.html?bvid=${videoId}&page=1&high_quality=1&danmaku=0`,
          },
        })
      },
      setYoutubeVideo: (options) => ({ commands }) => {
        const videoId = extractYoutubeVideoId(options.src)
        if (!videoId) return false

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: `https://www.youtube.com/embed/${videoId}`,
          },
        })
      },
      setDouyinVideo: (options) => ({ commands }) => {
        const videoId = extractDouyinVideoId(options.src)
        if (!videoId) return false

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: createDouyinPlayerSrc(videoId),
            width: 720,
            height: 1280,
          },
        })
      },
      setTiktokVideo: (options) => ({ commands }) => {
        const videoId = extractDouyinVideoId(options.src)
        if (!videoId) return false

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: createDouyinPlayerSrc(videoId),
            width: 720,
            height: 1280,
          },
        })
      },
      setUploadedVideo: (options) => ({ commands }) => {
        if (!options.src) return false

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: options.src,
            type: 'video',
            width: options.width || 640,
            height: options.height || 360,
          },
        })
      }
    }
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement('div')
      div.className = 'sky-video-container'
      div.setAttribute('data-video-embed', '')
      div.setAttribute('data-src', node.attrs.src)
      div.setAttribute('data-type', node.attrs.type)

      if (node.attrs.type === 'video') {
        const video = document.createElement('video')
        video.src = node.attrs.src
        video.controls = true
        video.preload = 'metadata'
        div.appendChild(video)
      } else {
        const iframe = document.createElement('iframe')
        iframe.src = node.attrs.src
        iframe.allowFullscreen = true
        iframe.frameBorder = '0'
        if (node.attrs.src?.includes('open.douyin.com/player/video')) {
          iframe.referrerPolicy = 'unsafe-url'
        }
        div.appendChild(iframe)
      }

      return { dom: div }
    }
  },
})

export default VideoEmbed
