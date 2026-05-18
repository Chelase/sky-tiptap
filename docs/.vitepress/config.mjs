import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Sky Tiptap',
  description: '适用于 Vue3 的 Tiptap 富文本编辑器组件',
  base: '/sky-tiptap/',

  head: [
    ['link', { rel: 'icon', href: '/sky-tiptap/logo.png' }]
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/Chelase/sky-tiptap' }
    ],

    sidebar: [
      {
        text: '指南',
        items: [
          { text: '介绍', link: '/guide/' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '图片上传', link: '/guide/image-upload' },
          { text: '视频嵌入', link: '/guide/video-embed' },
          { text: '链接', link: '/guide/link' }
        ]
      },
      {
        text: 'API',
        items: [
          { text: 'API 概览', link: '/api/' },
          { text: '组件配置', link: '/api/props' },
          { text: '事件', link: '/api/events' },
          { text: '实例方法', link: '/api/methods' },
          { text: '媒体 API', link: '/api/media' },
          { text: 'AI API', link: '/api/ai' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Chelase/sky-tiptap' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Chelsea'
    },

    search: {
      provider: 'local'
    }
  }
})
