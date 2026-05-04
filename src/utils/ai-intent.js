import { parseAiActionResponse } from './ai-actions'

const URL_PATTERN = /https?:\/\/[^\s"'<>，。！？、）)]+/i
const IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i
const VIDEO_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i

const getText = (value) => typeof value === 'string' ? value.trim() : ''

export const extractFirstUrl = (text) => {
  return getText(text).match(URL_PATTERN)?.[0] || ''
}

const extractTrailingText = (text) => {
  const value = getText(text)
  const match = value.match(/[：:]\s*([^：:\n]+)$/)
  return match?.[1]?.trim() || ''
}

const includesAny = (text, keywords) => {
  const value = getText(text).toLowerCase()
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()))
}

const resolveHeading = (text) => {
  if (!includesAny(text, ['标题', 'heading'])) {
    return null
  }

  const value = getText(text)
  const levelMatch = value.match(/([一二三123])\s*级|h([123])/i)
  const rawLevel = levelMatch?.[1] || levelMatch?.[2] || '2'
  const levelMap = {
    一: 1,
    '1': 1,
    二: 2,
    '2': 2,
    三: 3,
    '3': 3,
  }
  const headingText = extractTrailingText(value)

  if (!headingText) {
    return null
  }

  return {
    type: 'setHeading',
    params: {
      level: levelMap[rawLevel] || 2,
      text: headingText,
    },
  }
}

const resolveTable = (text) => {
  if (!includesAny(text, ['表格', 'table'])) {
    return null
  }

  const value = getText(text)
  const rowsColsMatch = value.match(/(\d+)\s*行\s*(\d+)\s*列|(\d+)\s*[x×]\s*(\d+)/i)
  const colsOnlyMatch = value.match(/(\d+)\s*列/)

  return {
    type: 'insertTable',
    params: {
      rows: Number(rowsColsMatch?.[1] || rowsColsMatch?.[3] || 3),
      cols: Number(rowsColsMatch?.[2] || rowsColsMatch?.[4] || colsOnlyMatch?.[1] || 3),
      withHeaderRow: !includesAny(value, ['无表头', '不要表头', 'no header']),
    },
  }
}

const resolveMediaOrEmbed = (text) => {
  const value = getText(text)
  const url = extractFirstUrl(value)

  if (includesAny(value, ['上传图片', '选择图片', '本地图片'])) {
    return { type: 'requestImageUpload', params: {} }
  }

  if (includesAny(value, ['上传视频', '选择视频', '本地视频'])) {
    return { type: 'requestVideoUpload', params: {} }
  }

  if (includesAny(value, ['bilibili', 'b站', '哔哩', 'BV'])) {
    const bv = value.match(/BV[a-zA-Z0-9]+/)?.[0]
    return url || bv
      ? { type: 'insertBilibiliVideo', params: { src: url || bv } }
      : { type: 'requestBilibiliVideo', params: {} }
  }

  if (includesAny(value, ['youtube', 'youtu.be'])) {
    return url
      ? { type: 'insertYoutubeVideo', params: { src: url } }
      : { type: 'requestYoutubeVideo', params: {} }
  }

  if (includesAny(value, ['抖音', 'douyin', 'tiktok'])) {
    const videoId = value.match(/\b\d{10,}\b/)?.[0]
    return url || videoId
      ? { type: 'insertDouyinVideo', params: { src: url || videoId } }
      : { type: 'requestDouyinVideo', params: {} }
  }

  if (includesAny(value, ['嵌入网站', '嵌入网页', 'iframe', '网页'])) {
    return url
      ? { type: 'insertIframe', params: { src: url } }
      : { type: 'requestIframeUrl', params: {} }
  }

  if (includesAny(value, ['图片', 'image'])) {
    if (url && IMAGE_PATTERN.test(url)) {
      return { type: 'insertImage', params: { src: url } }
    }

    return url
      ? { type: 'insertImage', params: { src: url } }
      : { type: 'requestImageUrl', params: {} }
  }

  if (includesAny(value, ['视频', 'video'])) {
    if (url && VIDEO_PATTERN.test(url)) {
      return { type: 'insertUploadedVideo', params: { src: url } }
    }

    return url
      ? { type: 'insertUploadedVideo', params: { src: url } }
      : { type: 'requestUploadedVideoUrl', params: {} }
  }

  return null
}

const resolveSimpleCommand = (text) => {
  if (includesAny(text, ['无序列表', 'bullet list'])) {
    return { type: 'toggleBulletList', params: {} }
  }

  if (includesAny(text, ['有序列表', 'ordered list'])) {
    return { type: 'toggleOrderedList', params: {} }
  }

  if (includesAny(text, ['分割线', '分隔线', 'divider', 'horizontal rule'])) {
    return { type: 'insertDivider', params: {} }
  }

  if (includesAny(text, ['取消链接', '移除链接', '删除链接'])) {
    return { type: 'unsetLink', params: {} }
  }

  if (includesAny(text, ['插入链接', '添加链接', '设置链接'])) {
    const url = extractFirstUrl(text)
    return url
      ? { type: 'setLink', params: { href: url } }
      : { type: 'requestLink', params: {} }
  }

  return null
}

export const resolveActionsFromText = (text) => {
  const value = getText(text)
  if (!value) {
    return []
  }

  if (
    includesAny(value, ['上传', '选择', '本地'])
    && includesAny(value, ['图片', 'image'])
    && includesAny(value, ['视频', 'video'])
  ) {
    return [
      { type: 'requestImageUpload', params: {} },
      { type: 'requestVideoUpload', params: {} },
    ]
  }

  const resolvedAction = resolveMediaOrEmbed(value)
    || resolveTable(value)
    || resolveHeading(value)
    || resolveSimpleCommand(value)

  return resolvedAction ? [resolvedAction] : []
}

export const resolveActionsFromAiText = (text) => {
  try {
    return parseAiActionResponse(text)
  } catch {
    return resolveActionsFromText(text)
  }
}
