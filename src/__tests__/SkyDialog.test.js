import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

import SkyDialog from '../components/Dialog/SkyDialog.vue'
import { emitter } from '../utils/emitter'

const openDialog = async (options) => {
  emitter.emit('open-dialog', options)
  await nextTick()
  await flushPromises()
}

const typeIntoDialog = async (value) => {
  const input = document.body.querySelector('.sky-dialog__input')
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('SkyDialog', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders input mode and confirms with the trimmed value', async () => {
    const onConfirm = vi.fn()
    wrapper = mount(SkyDialog, {
      attachTo: document.body,
    })

    await openDialog({
      mode: 'input',
      title: '设置链接',
      inputLabel: '链接地址',
      defaultValue: ' https://example.com ',
      onConfirm,
    })

    expect(document.body.querySelector('.sky-dialog__title').textContent).toBe('设置链接')
    expect(document.body.querySelector('.sky-dialog__input').value).toBe(' https://example.com ')

    document.body.querySelector('.sky-dialog__button--primary').click()
    await nextTick()
    await flushPromises()

    expect(onConfirm).toHaveBeenCalledWith('https://example.com')
    expect(document.body.querySelector('.sky-dialog')).toBeNull()
  })

  it('shows validation errors and does not confirm invalid input', async () => {
    const onConfirm = vi.fn()
    wrapper = mount(SkyDialog, {
      attachTo: document.body,
    })

    await openDialog({
      mode: 'input',
      title: '插入视频',
      inputLabel: '视频链接',
      validate: (value) => value ? '' : '请输入视频链接',
      onConfirm,
    })

    await typeIntoDialog('   ')
    document.body.querySelector('.sky-dialog__button--primary').click()
    await nextTick()
    await flushPromises()

    expect(onConfirm).not.toHaveBeenCalled()
    expect(document.body.querySelector('.sky-dialog__error').textContent).toBe('请输入视频链接')
    expect(document.body.querySelector('.sky-dialog')).not.toBeNull()
  })

  it('renders message mode and confirms without input', async () => {
    const onConfirm = vi.fn()
    wrapper = mount(SkyDialog, {
      attachTo: document.body,
    })

    await openDialog({
      mode: 'message',
      title: '无法插入视频',
      message: '未匹配到视频 ID',
      onConfirm,
    })

    expect(document.body.querySelector('.sky-dialog__message').textContent).toBe('未匹配到视频 ID')

    document.body.querySelector('.sky-dialog__button--primary').click()
    await nextTick()
    await flushPromises()

    expect(onConfirm).toHaveBeenCalledWith(true)
    expect(document.body.querySelector('.sky-dialog')).toBeNull()
  })

  it('calls onCancel and closes when cancelled', async () => {
    const onCancel = vi.fn()
    wrapper = mount(SkyDialog, {
      attachTo: document.body,
    })

    await openDialog({
      mode: 'input',
      title: '设置链接',
      inputLabel: '链接地址',
      onCancel,
    })

    document.body.querySelector('.sky-dialog__button--ghost').click()
    await nextTick()

    expect(onCancel).toHaveBeenCalled()
    expect(document.body.querySelector('.sky-dialog')).toBeNull()
  })
})
