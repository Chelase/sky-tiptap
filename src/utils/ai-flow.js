/**
 * Sky Tiptap - AI 生成流程
 *
 * 把 AI 内容生成与 AI 操控编辑器的流程从主组件中抽离，
 * 主组件只负责提供编辑器实例、配置与各类上传/弹窗触发器。
 */

import { renderMarkdown, requestAiContent } from './ai'
import { describeAiActions, executeAiActions } from './ai-actions'
import { resolveActionsFromAiText, resolveActionsFromText } from './ai-intent'
import { emitter } from './emitter'

/**
 * 创建 AI 流程
 *
 * @param {Object} options
 * @param {Function} options.getEditor 获取编辑器实例
 * @param {Function} options.getAiConfig 获取 AI 配置
 * @param {Function} options.showMessageDialog 展示消息弹窗
 * @param {Object} [options.requestHandlers] AI actions 需要的外部触发器
 * @returns {Object} { handleAIGenerated, insertGeneratedContent }
 */
export const createAiFlow = ({ getEditor, getAiConfig, showMessageDialog, requestHandlers = {} }) => {
  const editor = {
    get value() {
      return getEditor()
    },
  }
  const aiConfig = {
    get value() {
      return getAiConfig()
    },
  }

  const insertGeneratedContent = (content) => {
    editor.value?.chain().focus().insertContent(content).run()
  }

  const createAiLoadingId = () => `sky-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const findAiLoadingRange = (loadingId) => {
    const activeEditor = editor.value
    if (!activeEditor?.state?.doc || !loadingId) {
      return null
    }

    let foundRange = null
    activeEditor.state.doc.descendants((node, pos) => {
      if (node.type?.name === 'aiLoading' && node.attrs?.id === loadingId) {
        foundRange = {
          from: pos,
          to: pos + node.nodeSize,
        }
        return false
      }

      return true
    })

    return foundRange
  }

  const insertAiLoading = (range) => {
    const activeEditor = editor.value
    if (!activeEditor) {
      return null
    }

    const loadingId = createAiLoadingId()
    activeEditor.chain().focus().insertContentAt({
      from: range.from,
      to: range.to,
    }, {
      type: 'aiLoading',
      attrs: {
        id: loadingId,
      },
    }).run()

    const selection = activeEditor.state?.selection
    if (selection?.from) {
      range.to = selection.from
    }

    return loadingId
  }

  const replaceGeneratedContent = (content, range, loadingId) => {
    const activeEditor = editor.value
    if (!activeEditor) {
      return
    }

    const targetRange = findAiLoadingRange(loadingId) || range
    activeEditor.chain().focus().insertContentAt({
      from: targetRange.from,
      to: targetRange.to,
    }, content).run()

    const selection = activeEditor.state?.selection
    if (selection?.from) {
      range.from = targetRange.from
      range.to = selection.from
    }
  }

  const requestAndExecuteAiActions = async (prompt, generatedRange, loadingId, { fallbackToContent = false } = {}) => {
    const executeActions = async (actions) => {
      const shouldPreviewActions = aiConfig.value?.previewActions === true || aiConfig.value?.executeActions === false
      const shouldExecuteActions = aiConfig.value?.executeActions !== false
      const shouldRollbackActions = aiConfig.value?.rollbackOnActionFailure !== false
      const shouldShowActionResult = aiConfig.value?.showActionResult === true

      replaceGeneratedContent('', generatedRange, loadingId)

      if (shouldPreviewActions) {
        const confirmed = await confirmActionPreview(actions)
        if (!confirmed || !shouldExecuteActions) {
          return
        }
      }

      const snapshot = shouldRollbackActions ? editor.value?.getHTML?.() : null
      const result = executeAiActions(editor.value, actions, {
        requestImageUpload: requestHandlers.requestImageUpload,
        requestVideoUpload: requestHandlers.requestVideoUpload,
        requestImageUrl: requestHandlers.requestImageUrl,
        requestUploadedVideoUrl: requestHandlers.requestUploadedVideoUrl,
        requestBilibiliVideo: requestHandlers.requestBilibiliVideo,
        requestYoutubeVideo: requestHandlers.requestYoutubeVideo,
        requestDouyinVideo: requestHandlers.requestDouyinVideo,
        requestIframeUrl: requestHandlers.requestIframeUrl,
        requestLink: requestHandlers.requestLink,
      })
      if (!result.ok) {
        if (shouldRollbackActions && snapshot !== null && snapshot !== undefined) {
          editor.value?.commands?.setContent?.(snapshot)
        }
        throw new Error(result.message || 'AI 操作执行失败')
      }

      if (shouldShowActionResult && !hasFollowUpAction(actions)) {
        showActionResultDialog(result)
      }
    }

    const promptActions = resolveActionsFromText(prompt)
    if (promptActions.length) {
      await executeActions(promptActions)
      return
    }

    const responseText = await requestAiContent({
      ...aiConfig.value,
      prompt,
      forceTextResponse: true,
      parseResponse: aiConfig.value.parseResponse || ((text) => text),
    })
    const actions = resolveActionsFromAiText(responseText)

    if (!actions.length) {
      if (fallbackToContent) {
        replaceGeneratedContent(renderMarkdown(responseText), generatedRange, loadingId)
        return
      }

      throw new Error('未识别到可执行的编辑器操作')
    }

    await executeActions(actions)
  }

  const handleAIGenerated = () => {
    const aiMode = aiConfig.value?.mode || 'content'
    const isActionsMode = aiMode === 'actions'
    const isAutoMode = aiMode === 'auto'
    const isEditorIntentMode = isActionsMode || isAutoMode

    emitter.emit('open-dialog', {
      mode: 'input',
      title: isEditorIntentMode ? 'AI 操控编辑器' : 'AI 生成内容',
      description: isEditorIntentMode ? '输入编辑需求，项目会优先识别并执行受控编辑器操作。' : '输入生成要求，AI 返回的内容会插入到当前光标位置。',
      inputLabel: isEditorIntentMode ? '编辑需求' : '生成提示词',
      placeholder: isEditorIntentMode ? '例如：插入抖音视频：https://www.douyin.com/video/...' : '例如：写一段产品介绍，语气专业简洁',
      confirmText: isEditorIntentMode ? '执行' : '生成',
      loadingText: isEditorIntentMode ? '执行中...' : '生成中...',
      closeOnConfirm: true,
      validate: (value) => value ? '' : (isEditorIntentMode ? '请输入编辑需求' : '请输入生成提示词'),
      onConfirm: async (prompt) => {
        const selection = editor.value?.state?.selection
        const generatedRange = {
          from: selection?.from || 0,
          to: selection?.to || selection?.from || 0,
        }
        let hasStreamingContent = false
        const loadingId = insertAiLoading(generatedRange)

        try {
          if (isEditorIntentMode) {
            await requestAndExecuteAiActions(prompt, generatedRange, loadingId, {
              fallbackToContent: isAutoMode,
            })
            return
          }

          const content = await requestAiContent({
            ...aiConfig.value,
            prompt,
            onContent: ({ html }) => {
              if (!html) {
                return
              }

              hasStreamingContent = true
              replaceGeneratedContent(html, generatedRange, loadingId)
            },
          })

          if (hasStreamingContent) {
            replaceGeneratedContent(content, generatedRange, loadingId)
          } else {
            replaceGeneratedContent(content, generatedRange, loadingId)
          }
        } catch (error) {
          replaceGeneratedContent('', generatedRange, loadingId)
          showMessageDialog(isEditorIntentMode ? 'AI 操作失败' : 'AI 生成失败', error?.message || '请求失败，请稍后重试')
        }
      },
    })
  }

  const confirmActionPreview = (actions) => {
    return new Promise((resolve) => {
      emitter.emit('open-dialog', {
        mode: 'message',
        title: '确认执行操作',
        description: '项目已把输入解析为以下受控编辑器操作。',
        message: describeAiActions(actions).map((item, index) => `${index + 1}. ${item}`).join('\n'),
        confirmText: aiConfig.value?.executeActions === false ? '知道了' : '执行',
        cancelText: aiConfig.value?.executeActions === false ? '关闭' : '取消',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }

  const showActionResultDialog = (result) => {
    const summary = Array.isArray(result?.summary) ? result.summary : []
    showMessageDialog(
      result?.ok ? 'AI 操作完成' : 'AI 操作失败',
      summary.length ? summary.map((item, index) => `${index + 1}. ${item}`).join('\n') : (result?.message || '没有可显示的操作结果')
    )
  }

  const hasFollowUpAction = (actions) => {
    return actions.some((action) => typeof action?.type === 'string' && action.type.startsWith('request'))
  }

  return {
    handleAIGenerated,
    insertGeneratedContent,
  }
}
