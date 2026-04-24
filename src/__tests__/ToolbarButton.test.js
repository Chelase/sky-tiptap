import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToolbarButton from '../components/Toolbar/ToolbarButton.vue'

describe('ToolbarButton Component', () => {
  it('renders with iconSvg', () => {
    const wrapper = mount(ToolbarButton, {
      props: {
        onClick: vi.fn(),
        iconSvg: '<svg><path d="M1 1"/></svg>',
        tooltip: 'Bold'
      }
    })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('button').attributes('title')).toBe('Bold')
    expect(wrapper.find('button').attributes('type')).toBe('button')
  })

  it('renders slot content when no iconSvg', () => {
    const wrapper = mount(ToolbarButton, {
      props: {
        onClick: vi.fn()
      },
      slots: {
        default: 'H1'
      }
    })
    expect(wrapper.text()).toContain('H1')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    const wrapper = mount(ToolbarButton, {
      props: { onClick }
    })
    await wrapper.find('button').trigger('click')
    expect(onClick).toHaveBeenCalled()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    const wrapper = mount(ToolbarButton, {
      props: { onClick, disabled: true }
    })
    await wrapper.find('button').trigger('click')
    expect(onClick).not.toHaveBeenCalled()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('applies active class when isActive is true', () => {
    const wrapper = mount(ToolbarButton, {
      props: {
        onClick: vi.fn(),
        isActive: true
      }
    })
    expect(wrapper.find('button').classes()).toContain('is-active')
  })
})
