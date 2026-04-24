import { describe, it, expect, vi } from 'vitest'
import { SkyTiptap, insertImage, getContent, emitter, editorRef } from '../main.js'

describe('Main exports', () => {
  it('should export SkyTiptap component', () => {
    expect(SkyTiptap).toBeDefined()
  })

  it('should export insertImage function', () => {
    expect(typeof insertImage).toBe('function')
  })

  it('should export getContent function', () => {
    expect(typeof getContent).toBe('function')
  })

  it('should export emitter', () => {
    expect(emitter).toBeDefined()
    expect(typeof emitter.emit).toBe('function')
    expect(typeof emitter.on).toBe('function')
    expect(typeof emitter.off).toBe('function')
  })

  it('insertImage should warn when editor not initialized', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('window', { skyTiptapEditor: null })
    insertImage('https://example.com/image.png')
    expect(consoleSpy).toHaveBeenCalledWith('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
    consoleSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('getContent should warn and return empty when editor not initialized', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('window', { skyTiptapEditor: null })
    const result = getContent()
    expect(result).toBe('')
    expect(consoleSpy).toHaveBeenCalledWith('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
    consoleSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})
