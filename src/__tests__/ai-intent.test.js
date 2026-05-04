import { describe, expect, it } from 'vitest'

import {
  extractFirstUrl,
  resolveActionsFromAiText,
  resolveActionsFromText,
} from '../utils/ai-intent'

describe('AI intent resolver', () => {
  it('extracts the first http url from natural language', () => {
    expect(extractFirstUrl('插入：https://example.com/a.png，马上')).toBe('https://example.com/a.png')
  })

  it('resolves douyin video directly from user prompt', () => {
    expect(resolveActionsFromText('插入抖音视频：https://www.douyin.com/video/7633060374058167217')).toEqual([
      {
        type: 'insertDouyinVideo',
        params: {
          src: 'https://www.douyin.com/video/7633060374058167217',
        },
      },
    ])
  })

  it('resolves missing douyin url as a project-owned prompt action', () => {
    expect(resolveActionsFromText('插入抖音视频')).toEqual([
      {
        type: 'requestDouyinVideo',
        params: {},
      },
    ])
  })

  it('resolves bilibili, youtube and iframe commands', () => {
    expect(resolveActionsFromText('插入 B站视频 BV1xx411c7XW')).toEqual([
      {
        type: 'insertBilibiliVideo',
        params: {
          src: 'BV1xx411c7XW',
        },
      },
    ])

    expect(resolveActionsFromText('插入 youtube https://youtu.be/dQw4w9WgXcQ')).toEqual([
      {
        type: 'insertYoutubeVideo',
        params: {
          src: 'https://youtu.be/dQw4w9WgXcQ',
        },
      },
    ])

    expect(resolveActionsFromText('嵌入网站 https://example.com')).toEqual([
      {
        type: 'insertIframe',
        params: {
          src: 'https://example.com',
        },
      },
    ])
  })

  it('resolves upload requests without using AI output', () => {
    expect(resolveActionsFromText('上传图片')).toEqual([
      {
        type: 'requestImageUpload',
        params: {},
      },
    ])

    expect(resolveActionsFromText('选择本地视频')).toEqual([
      {
        type: 'requestVideoUpload',
        params: {},
      },
    ])

    expect(resolveActionsFromText('上传图片和视频')).toEqual([
      {
        type: 'requestImageUpload',
        params: {},
      },
      {
        type: 'requestVideoUpload',
        params: {},
      },
    ])
  })

  it('resolves table, heading, list, divider and link commands', () => {
    expect(resolveActionsFromText('插入 4 行 5 列表格')).toEqual([
      {
        type: 'insertTable',
        params: {
          rows: 4,
          cols: 5,
          withHeaderRow: true,
        },
      },
    ])

    expect(resolveActionsFromText('插入二级标题：项目计划')).toEqual([
      {
        type: 'setHeading',
        params: {
          level: 2,
          text: '项目计划',
        },
      },
    ])

    expect(resolveActionsFromText('无序列表')).toEqual([
      {
        type: 'toggleBulletList',
        params: {},
      },
    ])

    expect(resolveActionsFromText('插入分割线')).toEqual([
      {
        type: 'insertDivider',
        params: {},
      },
    ])

    expect(resolveActionsFromText('插入链接 https://example.com')).toEqual([
      {
        type: 'setLink',
        params: {
          href: 'https://example.com',
        },
      },
    ])
  })

  it('parses AI JSON when available and falls back to natural language', () => {
    expect(resolveActionsFromAiText(JSON.stringify({
      mode: 'actions',
      actions: [
        {
          type: 'insertDivider',
        },
      ],
    }))).toEqual([
      {
        type: 'insertDivider',
        params: {},
      },
    ])

    expect(resolveActionsFromAiText('可以插入抖音视频：https://www.douyin.com/video/7633060374058167217')).toEqual([
      {
        type: 'insertDouyinVideo',
        params: {
          src: 'https://www.douyin.com/video/7633060374058167217',
        },
      },
    ])
  })

  it('returns no actions for unsupported text', () => {
    expect(resolveActionsFromText('帮我优化一下内容')).toEqual([])
  })
})
