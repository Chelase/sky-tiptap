// extensions/CustomParagraph.js
import { Paragraph } from '@tiptap/extension-paragraph'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CustomParagraphComponent from '../../components/CustomParagraphComponent.vue'

export const CustomParagraph = Paragraph.extend({
    addNodeView() {
        return VueNodeViewRenderer(CustomParagraphComponent)
    },
})