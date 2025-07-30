// main.js
import { ref } from 'vue'
import SkyTiptapComponent from './index.vue'
import InsertMenu from './components/InsertMenu.vue'
import './style/index.scss'

import { createApp } from 'vue'
import App from './App.vue'
import {emitter} from "./utils/emitter";

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

// 添加全局点击事件处理
document.addEventListener('click', () => {
    // 点击页面任何地方时隐藏所有段落按钮
    emitter.emit('hide-all-paragraph-buttons')
})



const app = createApp(App)

app.component('InsertMenu', InsertMenu)

app.mount('#app')
