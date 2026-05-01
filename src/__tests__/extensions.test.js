import { describe, it, expect } from 'vitest'
import VideoEmbed from '../extensions/web-video.js'
import Iframe from '../extensions/iframe.js'
import { CustomParagraph } from '../extensions/CustomParagraph.js'

describe('Tiptap Extensions', () => {
  it('VideoEmbed should have correct configuration', () => {
    expect(VideoEmbed.name).toBe('videoEmbed')
    expect(VideoEmbed.options).toBeDefined()
  })

  it('VideoEmbed should define video embed attributes and parse rules', () => {
    const attrs = VideoEmbed.config.addAttributes()
    const parseRules = VideoEmbed.config.parseHTML()
    expect(attrs.src).toBeDefined()
    expect(attrs.width).toBeDefined()
    expect(attrs.height).toBeDefined()
    expect(parseRules).toBeInstanceOf(Array)
    expect(parseRules[0].tag).toBe('div[data-video-embed]')
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
})
