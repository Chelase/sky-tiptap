import { describe, it, expect, vi } from 'vitest'
import { Schema } from '@tiptap/pm/model'
import VideoEmbed, {
  createDouyinPlayerSrc,
  extractBilibiliVideoId,
  extractDouyinVideoId,
  extractYoutubeVideoId,
} from '../extensions/web-video.js'
import Iframe from '../extensions/iframe.js'
import { CustomParagraph } from '../extensions/CustomParagraph.js'
import BeforeChange from '../extensions/before-change.js'
import { TipTapPlugin } from '../config/default.js'

const beforeChangeSchema = new Schema({
  nodes: {
    doc: {
      content: 'block+',
    },
    paragraph: {
      group: 'block',
      content: 'text*',
      toDOM: () => ['p', 0],
    },
    text: {
      group: 'inline',
    },
  },
  marks: {},
})

const createBeforeChangePlugin = (onBeforeChange) => {
  return BeforeChange
    .configure({ onBeforeChange })
    .config
    .addProseMirrorPlugins
    .call({
      options: { onBeforeChange },
      editor: {},
    })[0]
}

const createBeforeChangeState = (text = 'current') => {
  return {
    schema: beforeChangeSchema,
    doc: beforeChangeSchema.node('doc', null, [
      beforeChangeSchema.node('paragraph', null, text ? [beforeChangeSchema.text(text)] : []),
    ]),
  }
}

const createBeforeChangeTransaction = (text = 'next') => {
  return {
    docChanged: true,
    doc: createBeforeChangeState(text).doc,
  }
}

describe('Tiptap Extensions', () => {
  it('VideoEmbed should have correct configuration', () => {
    expect(VideoEmbed.name).toBe('videoEmbed')
    expect(VideoEmbed.options).toBeDefined()
  })

  it('VideoEmbed should define video embed attributes and parse rules', () => {
    const attrs = VideoEmbed.config.addAttributes()
    const parseRules = VideoEmbed.config.parseHTML()
    expect(attrs.src).toBeDefined()
    expect(attrs.type).toBeDefined()
    expect(attrs.width).toBeDefined()
    expect(attrs.height).toBeDefined()
    expect(parseRules).toBeInstanceOf(Array)
    expect(parseRules[0].tag).toBe('div[data-video-embed]')
  })

  it('VideoEmbed should extract Bilibili video IDs from supported URLs', () => {
    expect(extractBilibiliVideoId('BV1xx411c7mD')).toBe('BV1xx411c7mD')
    expect(extractBilibiliVideoId('https://www.bilibili.com/video/BV1xx411c7mD/')).toBe('BV1xx411c7mD')
    expect(extractBilibiliVideoId('https://example.com/video')).toBe(null)
  })

  it('VideoEmbed should extract YouTube video IDs from supported URLs', () => {
    expect(extractYoutubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYoutubeVideoId('https://example.com/video')).toBe(null)
  })

  it('VideoEmbed should extract Douyin video IDs from supported URLs', () => {
    expect(extractDouyinVideoId('7380000000000000000')).toBe('7380000000000000000')
    expect(extractDouyinVideoId('https://www.douyin.com/video/7635170198135278902')).toBe('7635170198135278902')
    expect(extractDouyinVideoId('https://www.douyin.com/video/7380000000000000000')).toBe('7380000000000000000')
    expect(extractDouyinVideoId('https://www.iesdouyin.com/share/video/7380000000000000000/')).toBe('7380000000000000000')
    expect(extractDouyinVideoId('https://open.douyin.com/player/video?vid=7380000000000000000&autoplay=0')).toBe('7380000000000000000')
    expect(extractDouyinVideoId('https://www.douyin.com/user/example?modal_id=7380000000000000000')).toBe('7380000000000000000')
    expect(extractDouyinVideoId('https://v.douyin.com/example/')).toBe(null)
  })

  it('VideoEmbed should create the official Douyin iframe player URL', () => {
    expect(createDouyinPlayerSrc('7380000000000000000')).toBe(
      'https://open.douyin.com/player/video?vid=7380000000000000000&autoplay=0',
    )
  })

  it('VideoEmbed should not insert Bilibili video when ID is missing', () => {
    const insertContent = vi.fn()
    const commands = VideoEmbed.config.addCommands.call({ name: 'videoEmbed' })

    const result = commands.setBilibiliVideo({ src: 'https://example.com/video' })({
      commands: { insertContent },
    })

    expect(result).toBe(false)
    expect(insertContent).not.toHaveBeenCalled()
  })

  it('VideoEmbed should not insert YouTube video when ID is missing', () => {
    const insertContent = vi.fn()
    const commands = VideoEmbed.config.addCommands.call({ name: 'videoEmbed' })

    const result = commands.setYoutubeVideo({ src: 'https://example.com/video' })({
      commands: { insertContent },
    })

    expect(result).toBe(false)
    expect(insertContent).not.toHaveBeenCalled()
  })

  it('VideoEmbed should not insert Douyin video when ID is missing', () => {
    const insertContent = vi.fn()
    const commands = VideoEmbed.config.addCommands.call({ name: 'videoEmbed' })

    const result = commands.setDouyinVideo({ src: 'https://v.douyin.com/example/' })({
      commands: { insertContent },
    })

    expect(result).toBe(false)
    expect(insertContent).not.toHaveBeenCalled()
  })

  it('VideoEmbed should insert Douyin player attrs through its command', () => {
    const insertContent = vi.fn()
    const commands = VideoEmbed.config.addCommands.call({ name: 'videoEmbed' })

    commands.setDouyinVideo({ src: 'https://www.douyin.com/video/7380000000000000000' })({
      commands: { insertContent },
    })

    expect(insertContent).toHaveBeenCalledWith({
      type: 'videoEmbed',
      attrs: {
        src: 'https://open.douyin.com/player/video?vid=7380000000000000000&autoplay=0',
        width: 720,
        height: 1280,
      },
    })
  })

  it('VideoEmbed should insert uploaded video attrs through its command', () => {
    const insertContent = vi.fn()
    const commands = VideoEmbed.config.addCommands.call({ name: 'videoEmbed' })

    commands.setUploadedVideo({ src: 'https://example.com/video.mp4' })({
      commands: { insertContent },
    })

    expect(insertContent).toHaveBeenCalledWith({
      type: 'videoEmbed',
      attrs: {
        src: 'https://example.com/video.mp4',
        type: 'video',
        width: 640,
        height: 360,
      },
    })
  })

  it('VideoEmbed should not insert uploaded video when src is missing', () => {
    const insertContent = vi.fn()
    const commands = VideoEmbed.config.addCommands.call({ name: 'videoEmbed' })

    const result = commands.setUploadedVideo({ src: '' })({
      commands: { insertContent },
    })

    expect(result).toBe(false)
    expect(insertContent).not.toHaveBeenCalled()
  })

  it('VideoEmbed should render uploaded videos with a responsive video element', () => {
    const nodeView = VideoEmbed.config.addNodeView()
    const { dom } = nodeView({
      node: {
        attrs: {
          src: 'https://example.com/video.mp4',
          type: 'video',
          width: 640,
          height: 360,
        },
      },
    })

    const video = dom.querySelector('video')

    expect(video).toBeTruthy()
    expect(video.getAttribute('src')).toBe('https://example.com/video.mp4')
    expect(video.controls).toBe(true)
    expect(video.hasAttribute('width')).toBe(false)
    expect(video.hasAttribute('height')).toBe(false)
    expect(dom.getAttribute('data-type')).toBe('video')
  })

  it('Iframe should have correct configuration', () => {
    expect(Iframe.name).toBe('iframe')
    expect(Iframe.config).toBeDefined()
  })

  it('Iframe should parse iframe HTML', () => {
    const parseRules = Iframe.config.parseHTML()
    expect(parseRules).toBeInstanceOf(Array)
    expect(parseRules[0].tag).toBe('iframe')
  })

  it('CustomParagraph should extend Paragraph', () => {
    expect(CustomParagraph.name).toBe('paragraph')
    expect(CustomParagraph.config.addNodeView).toBeDefined()
  })

  it('CodeBlock should stay active after repeated Enter presses', () => {
    const codeBlock = TipTapPlugin.extensions.find((extension) => extension.name === 'codeBlock')

    expect(codeBlock).toBeDefined()
    expect(codeBlock.options.exitOnTripleEnter).toBe(false)
  })

  it('BeforeChange should ignore transactions that do not change the document', () => {
    const onBeforeChange = vi.fn()
    const plugin = createBeforeChangePlugin(onBeforeChange)

    const allowed = plugin.spec.filterTransaction({ docChanged: false }, createBeforeChangeState())

    expect(allowed).toBe(true)
    expect(onBeforeChange).not.toHaveBeenCalled()
  })

  it('BeforeChange should allow document changes when they are not prevented', () => {
    const onBeforeChange = vi.fn()
    const plugin = createBeforeChangePlugin(onBeforeChange)
    const state = createBeforeChangeState('current')
    const transaction = createBeforeChangeTransaction('next')

    const allowed = plugin.spec.filterTransaction(transaction, state)

    expect(allowed).toBe(true)
    expect(onBeforeChange).toHaveBeenCalledWith(expect.objectContaining({
      transaction,
      state,
      currentHTML: '<p>current</p>',
      nextHTML: '<p>next</p>',
    }))
  })

  it('BeforeChange should block document changes when preventDefault is called', () => {
    const onBeforeChange = vi.fn((payload) => {
      payload.preventDefault()
    })
    const plugin = createBeforeChangePlugin(onBeforeChange)
    const state = createBeforeChangeState('current')
    const transaction = createBeforeChangeTransaction('next')

    const allowed = plugin.spec.filterTransaction(transaction, state)

    expect(allowed).toBe(false)
    expect(onBeforeChange).toHaveBeenCalled()
  })
})
