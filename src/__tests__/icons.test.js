import { describe, it, expect } from 'vitest'
import { icons, getIcon, Icon } from '../icons'

describe('Icons Module', () => {
  it('should export all required icons', () => {
    const requiredIcons = [
      'bold', 'italic', 'underline', 'strike',
      'bulletList', 'orderedList',
      'image', 'video', 'link', 'website',
      'code', 'table', 'divider',
      'plus', 'undo', 'redo', 'delete',
      'ai', 'menu', 'close', 'check', 'chevronDown'
    ]
    requiredIcons.forEach(name => {
      expect(icons[name]).toBeDefined()
      expect(typeof icons[name]).toBe('string')
      expect(icons[name]).toContain('<svg')
    })
  })

  it('getIcon should return correct SVG', () => {
    expect(getIcon('bold')).toBe(icons.bold)
    expect(getIcon('nonexistent')).toBe('')
  })

  it('Icon component should have correct structure', () => {
    expect(Icon.name).toBe('SkyIcon')
    expect(Icon.props.name.type).toBe(String)
    expect(Icon.props.name.required).toBe(true)
    expect(Icon.props.size.default).toBe(18)
  })
})
