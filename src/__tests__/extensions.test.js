import { describe, it, expect, vi } from 'vitest'
import VideoEmbed, {
  createDouyinPlayerSrc,
  extractBilibiliVideoId,
  extractDouyinVideoId,
  extractYoutubeVideoId,
} from '../extensions/web-video.js'
import Iframe from '../extensions/iframe.js'
import { CustomParagraph } from '../extensions/CustomParagraph.js'
import { TipTapPlugin } from '../config/default.js'

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
})
