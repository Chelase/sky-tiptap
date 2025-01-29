# sky-tiptap



**这是一款适用于vue3的tiptap无头编辑器模板**



### 上传图片





```vue
vue
<template>
  <div>
    <sky-tiptap 
      v-model="content" 
      @uploadPhoto="handleUploadPhoto" 
      ref="childComponent"
    />
    <div>编辑器内容: {{ content }}</div>
  </div>
</template>

<script>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

export default {
  components: {
    ChildComponent,
  },
  setup() {
    const content = ref(''); // 用于存储编辑器的 HTML 内容
    const childComponent = ref(null); // 引用子组件

    const handleUploadPhoto = (file) => {
      const formData = new FormData();
      formData.append('file', file);

      // 调用上传 API
      publicApi.uploadPhoto(formData).then(res => {
        if (res.data && res.data.length > 0) {
          // 上传成功后，获取图片 URL
          const imageUrl = res.data[0]; // 假设返回的数据中包含图片 URL
          
          // 调用子组件的方法插入图片
          childComponent.value.insertImage(imageUrl);
        }
      }).catch(error => {
        console.error('图片上传失败:', error);
      });
    };

    return { content, handleUploadPhoto, childComponent };
  },
};
</script>
```



