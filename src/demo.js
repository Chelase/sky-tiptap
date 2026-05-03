// demo.js
// Sky Tiptap 开发环境示例应用入口

import { createApp } from 'vue'
import App from './App.vue'
import InsertMenu from './components/Toolbar/Menu/InsertMenu.vue'

const app = createApp(App)
app.component('InsertMenu', InsertMenu)
app.mount('#app')
