import { Extension, getHTMLFromFragment } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

const BeforeChange = Extension.create({
  name: 'beforeChange',

  addOptions() {
    return {
      onBeforeChange: null,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (transaction, state) => {
          if (!transaction.docChanged) {
            return true
          }

          if (typeof this.options.onBeforeChange !== 'function') {
            return true
          }

          let prevented = false
          const currentHTML = getHTMLFromFragment(state.doc.content, state.schema)
          const nextHTML = getHTMLFromFragment(transaction.doc.content, state.schema)

          this.options.onBeforeChange({
            transaction,
            state,
            editor: this.editor,
            currentHTML,
            nextHTML,
            preventDefault: () => {
              prevented = true
            },
          })

          return !prevented
        },
      }),
    ]
  },
})

export default BeforeChange
