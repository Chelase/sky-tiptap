import { Node, mergeAttributes } from '@tiptap/core'

const AiLoading = Node.create({
  name: 'aiLoading',

  group: 'block',

  atom: true,

  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-sky-ai-loading-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {}
          }

          return {
            'data-sky-ai-loading-id': attributes.id,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-sky-ai-loading]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-sky-ai-loading': 'true',
        class: 'sky-ai-loading',
        contenteditable: 'false',
      }),
      ['span', { class: 'sky-ai-loading__line sky-ai-loading__line--wide' }],
      ['span', { class: 'sky-ai-loading__line sky-ai-loading__line--medium' }],
      ['span', { class: 'sky-ai-loading__line sky-ai-loading__line--short' }],
    ]
  },
})

export default AiLoading
