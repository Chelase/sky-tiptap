import { describe, expect, it, vi } from 'vitest'

import {
  createAiRequestBody,
  extractAiContent,
  extractAiStreamContent,
  renderMarkdown,
  requestAiContent,
} from '../utils/ai'

describe('AI utilities', () => {
  it('extracts content from common response shapes', () => {
    expect(extractAiContent(' plain text ')).toBe('plain text')
    expect(extractAiContent({ content: 'content text' })).toBe('content text')
    expect(extractAiContent({ data: { text: 'data text' } })).toBe('data text')
    expect(extractAiContent({
      choices: [
        {
          message: {
            content: 'chat content',
          },
        },
      ],
    })).toBe('chat content')
  })

  it('posts prompt with baseUrl and apiKey, then returns extracted content', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          content: '生成内容',
        },
      }),
    }))

    const content = await requestAiContent({
      baseUrl: 'https://api.example.com/generate',
      apiKey: 'secret',
      prompt: '生成一段内容',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
      },
      body: JSON.stringify({ prompt: '生成一段内容' }),
    })
    expect(content).toBe('<p>生成内容</p>\n')
  })

  it('renders markdown content to HTML', () => {
    expect(renderMarkdown('## 标题\n\n- 第一项')).toBe('<h2>标题</h2>\n<ul>\n<li>第一项</li>\n</ul>\n')
  })

  it('passes requestBody through without changing its shape', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        output_text: '<p>通用接口返回</p>',
      }),
    }))

    await requestAiContent({
      baseUrl: 'https://www.right.codes/codex/v1/responses',
      apiKey: 'secret',
      prompt: '你好',
      requestBody: {
        model: 'gpt-5.2',
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: '由使用方预先定义的内容',
              },
            ],
          },
        ],
        stream: true,
      },
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith('https://www.right.codes/codex/v1/responses', expect.objectContaining({
      body: JSON.stringify({
        model: 'gpt-5.2',
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: '由使用方预先定义的内容',
              },
            ],
          },
        ],
        stream: true,
      }),
    }))
  })

  it('supports buildBody for fully custom request payloads using the input prompt', () => {
    const body = createAiRequestBody({
      prompt: '写一段内容',
      buildBody: (prompt) => ({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    expect(body).toEqual({
      messages: [
        {
          role: 'user',
          content: '写一段内容',
        },
      ],
    })
  })

  it('extracts content from server-sent event response text', () => {
    const content = extractAiStreamContent([
      'data: {"type":"response.output_text.delta","delta":"第一段"}',
      'data: {"choices":[{"delta":{"content":"第二段"}}]}',
      'data: [DONE]',
    ].join('\n'))

    expect(content).toBe('第一段第二段')
  })

  it('reads stream responses and reports rendered markdown updates', async () => {
    const encoder = new TextEncoder()
    const onContent = vi.fn()
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: '## 标题' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: '\n\n正文' })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      }),
      text: vi.fn(),
    }))

    const content = await requestAiContent({
      baseUrl: 'https://api.example.com/generate',
      apiKey: 'secret',
      prompt: '生成 markdown',
      requestBody: {
        stream: true,
      },
      fetchImpl,
      onContent,
    })

    expect(onContent).toHaveBeenLastCalledWith({
      delta: '\n\n正文',
      markdown: '## 标题\n\n正文',
      html: '<h2>标题</h2>\n<p>正文</p>\n',
    })
    expect(content).toBe('<h2>标题</h2>\n<p>正文</p>\n')
  })

  it('does not read a streamed response body twice when stream content is empty', async () => {
    const encoder = new TextEncoder()
    const text = vi.fn()
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      }),
      text,
    }))

    await expect(requestAiContent({
      baseUrl: 'https://api.example.com/generate',
      apiKey: 'secret',
      prompt: '生成 markdown',
      requestBody: {
        stream: true,
      },
      fetchImpl,
    })).rejects.toThrow('AI 接口未返回可插入内容')

    expect(text).not.toHaveBeenCalled()
  })

  it('throws when required config is missing', async () => {
    await expect(requestAiContent({
      baseUrl: '',
      apiKey: 'secret',
      prompt: '生成一段内容',
      fetchImpl: vi.fn(),
    })).rejects.toThrow('AI baseUrl 未配置')

    await expect(requestAiContent({
      baseUrl: 'https://api.example.com/generate',
      apiKey: '',
      prompt: '生成一段内容',
      fetchImpl: vi.fn(),
    })).rejects.toThrow('AI apiKey 未配置')
  })
})
