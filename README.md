# sky-tiptap



**这是一款适用于vue3的tiptap无头编辑器模板**



### 安装



```
npm install sky-tiptap
```



### 使用



```vue
<script setup>

import { SkyTiptap } from 'sky-tiptap'

const editor = ref()
const content = ref('')

</script>

<template>
  <sky-tiptap
        ref="editor"
        v-model="content"
    />
</template>
```







### 上传图片



sky-tiptap会返回文件，只需调用**insertImage**方法插入即可



```vue
vue
<template>
  <div>
    <sky-tiptap 
      ref="editor"
      v-model="content" 
      @uploadPhoto="handleUploadPhoto" 
    />
  </div>
</template>

<script setup>
import { SkyTiptap, insertImage } from 'sky-tiptap'
    
const handleUploadPhoto = async (file) => {
    console.log(file);
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await uploadPhoto(formData)
    let url = data[0]
    insertImage(url);
}
</script>
```



### 手动获取富文本内容



```vue
<script setup>
import { SkyTiptap, insertImage, getContent } from 'sky-tiptap'
    
const getValue = () => {
    let value = getContent()
    console.log(value)
}
</script>
```

