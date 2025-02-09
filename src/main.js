import { ref } from 'vue'
import SkyTiptapComponent from './index.vue'

// 导出一个全局的编辑器引用
export const editorRef = ref()

// 直接导出的 insertImage 函数
export const insertImage = (url) => {
    if (editorRef.value) {
        editorRef.value.insertImage(url)
    } else {
        console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
    }
}

export const getContent = () => {
    if (editorRef.value) {
        return editorRef.value.getContent()
    } else {
        console.warn('编辑器未初始化，请确保 SkyTiptap 组件已挂载')
        return ''
    }
}

// 默认导出组件
export { SkyTiptapComponent as SkyTiptap }