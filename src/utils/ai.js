import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const getNestedString = (value, paths) => {
  for (const path of paths) {
    const result = path.reduce((current, key) => current?.[key], value)
    if (typeof result === 'string' && result.trim()) {
      return result
    }
  }

  return ''
}

const getNestedDeltaString = (value) => {
  const result = getNestedString(value, [
    ['delta'],
    ['choices', 0, 'delta', 'content'],
    ['content'],
    ['text'],
    ['output_text'],
  ])

  return typeof result === 'string' && result.trim() ? result : ''
}

export const renderMarkdown = (content) => {
  if (typeof content !== 'string' || !content.trim()) {
    return ''
  }

  return markdown.render(content)
}

export const extractAiContent = (payload) => {
  if (typeof payload === 'string') {
    return payload.trim()
  }

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const directValue = getNestedString(payload, [
    ['content'],
    ['text'],
    ['message'],
    ['result'],
    ['data'],
    ['data', 'content'],
    ['data', 'text'],
    ['data', 'message'],
    ['output_text'],
    ['delta'],
    ['text', 'value'],
    ['response', 'output_text'],
    ['response', 'content'],
    ['choices', 0, 'message', 'content'],
    ['choices', 0, 'text'],
    ['choices', 0, 'delta', 'content'],
  ])

  if (directValue) {
    return directValue.trim()
  }

  const outputContent = payload.output?.[0]?.content
  if (Array.isArray(outputContent)) {
    return outputContent
      .map((item) => item?.text || item?.content || '')
      .filter(Boolean)
      .join('')
      .trim()
  }

  return ''
}

export const extractAiStreamContent = (text) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter((line) => line && line !== '[DONE]')
    .map((line) => {
      try {
        return extractAiContent(JSON.parse(line))
      } catch {
        return ''
      }
    })
    .filter(Boolean)
    .join('')
    .trim()
}

const parseAiStreamLine = (line) => {
  const value = line.trim()
  if (!value.startsWith('data:')) {
    return ''
  }

  const data = value.slice(5).trim()
  if (!data || data === '[DONE]') {
    return ''
  }

  try {
    return getNestedDeltaString(JSON.parse(data))
  } catch {
    return ''
  }
}

export const readAiStreamContent = async (response, onContent) => {
  if (!response.body?.getReader) {
    return ''
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let lineBuffer = ''
  let markdownContent = ''

  const flushLine = async (line) => {
    const delta = parseAiStreamLine(line)
    if (!delta) {
      return
    }

    markdownContent += delta
    await onContent?.({
      delta,
      markdown: markdownContent,
      html: renderMarkdown(markdownContent),
    })
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    lineBuffer += decoder.decode(value, { stream: true })
    const lines = lineBuffer.split(/\r?\n/)
    lineBuffer = lines.pop() || ''

    for (const line of lines) {
      await flushLine(line)
    }
  }

  lineBuffer += decoder.decode()
  if (lineBuffer.trim()) {
    await flushLine(lineBuffer)
  }

  return markdownContent.trim()
}

export const createAiRequestBody = ({
  prompt,
  requestBody,
  body,
  buildBody,
}) => {
  if (typeof buildBody === 'function') {
    return buildBody(prompt)
  }

  const fixedBody = requestBody ?? body
  if (fixedBody !== undefined) {
    return fixedBody
  }

  return { prompt }
}

export const createAiFetchRequest = async (config) => {
  const {
    baseUrl,
    apiKey,
    prompt,
    method = 'POST',
    headers = {},
    buildRequest,
  } = config

  if (typeof buildRequest === 'function') {
    const customRequest = await buildRequest({
      prompt,
      baseUrl,
      apiKey,
      config,
    })

    if (!customRequest) {
      throw new Error('AI buildRequest 未返回请求配置')
    }

    const customUrl = customRequest.url || baseUrl
    const customOptions = customRequest.fetchOptions || customRequest.options || customRequest
    const { url, fetchOptions, options, stream, ...requestOptions } = customOptions

    return {
      url: customUrl,
      options: requestOptions,
      stream: stream === true || config.stream === true,
    }
  }

  const requestBody = createAiRequestBody(config)
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...headers,
  }

  return {
    url: baseUrl,
    options: {
      method,
      headers: requestHeaders,
      body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody),
    },
    stream: config.stream === true || requestBody?.stream === true,
  }
}

export const requestAiContent = async ({ fetchImpl = fetch, ...config }) => {
  const { baseUrl, apiKey, prompt, parseResponse, onContent } = config

  if (!baseUrl) {
    throw new Error('AI baseUrl 未配置')
  }

  if (!apiKey) {
    throw new Error('AI apiKey 未配置')
  }

  if (!prompt) {
    throw new Error('请输入生成提示词')
  }

  const { url, options, stream } = await createAiFetchRequest(config)
  const response = await fetchImpl(url, options)

  if (!response.ok) {
    const errorText = typeof response.text === 'function' ? await response.text() : ''
    throw new Error(errorText || `AI 请求失败：${response.status}`)
  }

  if (stream && response.body?.getReader) {
    const streamMarkdownContent = await readAiStreamContent(response, onContent)
    if (streamMarkdownContent) {
      return renderMarkdown(streamMarkdownContent)
    }
  }

  const responseText = await response.text()

  if (typeof parseResponse === 'function') {
    const parsedContent = await parseResponse(responseText, response)
    if (typeof parsedContent === 'string' && parsedContent.trim()) {
      return parsedContent.trim()
    }
    throw new Error('AI 接口未返回可插入内容')
  }

  let payload = responseText
  try {
    payload = JSON.parse(responseText)
  } catch {
    // 非 JSON 响应按纯文本内容处理。
  }

  const content = extractAiContent(payload)
  if (content) {
    return renderMarkdown(content)
  }

  const streamContent = typeof responseText === 'string' ? extractAiStreamContent(responseText) : ''
  if (!streamContent) {
    throw new Error('AI 接口未返回可插入内容')
  }

  return renderMarkdown(streamContent)
}
