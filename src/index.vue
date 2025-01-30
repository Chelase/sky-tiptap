<script setup>
import {ref, onBeforeMount, onBeforeUnmount, watch} from 'vue'
import { TipTapPlugin } from './utils'
import {useEditor, EditorContent, BubbleMenu, FloatingMenu} from '@tiptap/vue-3'

const props = defineProps({
  modelValue: '',
  fileName: {
    type: String,
    default: 'file'
  }
})

const emit = defineEmits(['update:modelValue', 'uploadPhoto'])

const editor = useEditor(TipTapPlugin)
const width = ref(640)
const height = ref(480)

// 监听 props 的变化，更新 internalValue
watch(editor, () => {
  if (editor.value) {
    updateValue(); // 更新父组件的值
  }
});

const updateValue = () => {
  // 当 input 值变化时，通知父组件更新
  emit('update:modelValue', editor.value.getHTML());
};


// 在子组件中
const addImage = () => {
  const fileInput = document.getElementById('fileInput');
  fileInput.click();

  // 监听文件选择事件
  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    // 触发自定义事件，将文件传递给父组件
    emit('uploadPhoto', file);
  }, { once: true }); // 使用 { once: true } 确保事件监听器只触发一次
}

// 新增一个方法来插入图片
const insertImage = (imageUrl) => {
  editor.value.chain().focus().setImage({ src: imageUrl }).run();
};

function insertVideo() {
  let url = prompt('请输入视频链接', '')
  const videoId = extractVideoId(url); // 提取视频 ID 的函数
  const embedUrl = `https://www.youtube.com/embed/${videoId}`; // YouTube 嵌入链接

  editor.chain().focus().setVideoEmbed({ src: embedUrl }).run();
}

// 提取视频 ID 的简单示例
function extractVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

const addYoutube = () => {
  const url = prompt('请输入youtube视频链接')

  editor.value.commands.setYoutubeVideo({
    src: url,
    width: Math.max(320, parseInt(width.value, 10)) || 640,
    height: Math.max(180, parseInt(height.value, 10)) || 480,
    margin: 'auto'
  })
}

const addBilibili = () => {
  const url = prompt('请输入bilibili视频链接')
  const bvid = url.match(/video\/([^/]+)/)[1]; // 提取 Bilibili 视频 ID

  editor.value.commands.insertContent({
    type: 'video',
    attrs: {
      src: `https://player.bilibili.com/player.html?bvid=${bvid}`, // 生成嵌入链接
      width: 640,
      height: 360,
      bvid: bvid, // 存储 Bilibili 视频 ID
    },
  });
}

const addTiktok = async () => {
  const url = prompt('请输入抖音视频链接')
  const vid = url.match(/douyin.com\/video\/([^/]+)/)[1];
  const { data: { iframe_code } } = await otherApi.getTiktokVideo(vid)
  console.log(iframe_code);
}

const addWeb = () => {
  const url = prompt('请输入网站地址')
  editor.value.commands.insertContent({
    type: 'iframe',
    attrs: {
      src: url,
      width: '100%',
      height: 360,
      frameborder: '0',
      allowfullscreen: 'true',
    },
  });
}

onBeforeUnmount(() => {
  editor.value.destroy();
})

defineExpose({
  insertImage
});

</script>

<template>
  <input type="file" id="fileInput" style="display: none;" accept="image/*">
  <div class="container">

    <div class="editor">
      <editor-content :editor="editor" />
    </div>

    <div v-if="editor">
      <bubble-menu
          class="bubble-menu"
          :tippy-options="{ duration: 100 }"
          :editor="editor"
      >
        <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
          加粗
        </button>
        <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
          斜体
        </button>
        <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
          删除线
        </button>
        <button @click="addImage">上传图片</button>
        <button @click="insertVideo()">插入网络视频</button>
        <button id="youtube" @click="addYoutube()">
          嵌入youtube视频
        </button>
        <button id="bilibili" @click="addBilibili()">
          嵌入bilibili视频
        </button>
        <button id="tiktok" @click="addTiktok()">
          嵌入抖音视频
        </button>
        <button id="web" @click="addWeb()">
          嵌入网站
        </button>
      </bubble-menu>

      <floating-menu
          class="floating-menu"
          :tippy-options="{ duration: 100 }"
          :editor="editor"
      >
        <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">
          1级标题
        </button>
        <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">
          2级标题
        </button>
        <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }">
          无序列表
        </button>
        <button @click="addImage">上传图片</button>
        <button @click="insertVideo()">插入网络视频</button>
        <button id="youtube" @click="addYoutube()">
          嵌入youtube视频
        </button>
        <button id="bilibili" @click="addBilibili()">
          嵌入bilibili视频
        </button>
        <button id="tiktok" @click="addTiktok()">
          嵌入抖音视频
        </button>
        <button id="web" @click="addWeb()">
          嵌入网站
        </button>
      </floating-menu>
    </div>

  </div>
</template>

<style scoped>

</style>