import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import InsertMenu from '../components/Toolbar/Menu/InsertMenu.vue'
import { emitter } from '../utils/emitter'

const createEditor = () => ({
  isActive: vi.fn(() => false),
  chain: vi.fn(() => ({
    focus: vi.fn().mockReturnThis(),
    insertContent: vi.fn().mockReturnThis(),
    run: vi.fn(() => true),
  })),
})

describe('InsertMenu', () => {
  let wrapper = null

  beforeEach(() => {
    wrapper = mount(InsertMenu, {
      attachTo: document.body,
      props: { editor: createEditor() },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  const openMenu = async (insert = vi.fn()) => {
    emitter.emit('show-insert-menu', {
      position: { top: 120, left: 200 },
      insert,
    })
    await nextTick()
    await flushPromises()
  }

  it('opens on the show-insert-menu event', async () => {
    await openMenu()

    expect(document.body.querySelector('.sky-insert-menu')).toBeTruthy()
  })

  it('renders the block catalog with groups', async () => {
    await openMenu()

    const menu = document.body.querySelector('.sky-insert-menu')
    const titles = [...menu.querySelectorAll('.sky-insert-menu__title')].map((node) => node.textContent.trim())

    expect(titles.length).toBeGreaterThan(0)
    expect(menu.querySelectorAll('.sky-insert-menu__item').length).toBeGreaterThan(5)
  })

  it('filters the catalog with the search input', async () => {
    await openMenu()

    const input = document.body.querySelector('.sky-insert-menu__search-input')
    input.value = '视频'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    await flushPromises()

    const labels = [...document.body.querySelectorAll('.sky-insert-menu__label')].map((node) => node.textContent.trim())
    expect(labels).toContain('视频')
    expect(labels).not.toContain('表格')
  })

  it('calls the insert callback when an item is selected', async () => {
    const insert = vi.fn()
    await openMenu(insert)

    const items = [...document.body.querySelectorAll('.sky-insert-menu__item')]
    const target = items.find((node) => node.textContent.includes('表格'))
    target.click()
    await nextTick()

    expect(insert).toHaveBeenCalledWith('table')
    expect(document.body.querySelector('.sky-insert-menu')).toBeFalsy()
  })

  it('closes when escape is pressed', async () => {
    await openMenu()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(document.body.querySelector('.sky-insert-menu')).toBeFalsy()
  })
})
