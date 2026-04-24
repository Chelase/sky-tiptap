import { describe, it, expect, vi } from 'vitest'
import { emitter } from '../utils/emitter'

describe('Emitter (mitt)', () => {
  it('should emit and receive events', () => {
    const handler = vi.fn()
    emitter.on('test-event', handler)
    emitter.emit('test-event', 'payload')
    expect(handler).toHaveBeenCalledWith('payload')
    emitter.off('test-event', handler)
  })

  it('should support multiple listeners', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    emitter.on('multi-event', handler1)
    emitter.on('multi-event', handler2)
    emitter.emit('multi-event', 42)
    expect(handler1).toHaveBeenCalledWith(42)
    expect(handler2).toHaveBeenCalledWith(42)
    emitter.off('multi-event', handler1)
    emitter.off('multi-event', handler2)
  })

  it('should not call removed listeners', () => {
    const handler = vi.fn()
    emitter.on('remove-event', handler)
    emitter.off('remove-event', handler)
    emitter.emit('remove-event', 'data')
    expect(handler).not.toHaveBeenCalled()
  })
})
