  <!-- index.vue -->
  <script setup>
  import { editorRef } from './main'
  import { ref, onBeforeMount, onBeforeUnmount, watch, computed, onMounted } from 'vue'
  import { TipTapPlugin } from './utils'
  import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/vue-3'
  import { emitter } from "./utils/emitter";
  import Tooltip from "./components/tooltip.vue";
  import MarkdownIt from 'markdown-it';

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

  const handleContainerClick = (e) => {
    // 当点击编辑器容器时，隐藏所有段落按钮
    emitter.emit('hide-all-paragraph-buttons')
  }


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

  // 提取视频 ID 的简单示例
  function extractVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  const addYoutube = () => {
    const url = prompt('请输入youtube视频链接')
    if (!url) return
    editor.value.commands.setYoutubeVideo({
      src: url,
      width: Math.max(320, parseInt(width.value, 10)) || 640,
      height: Math.max(180, parseInt(height.value, 10)) || 480,
      margin: 'auto'
    })
  }

  const addBilibili = () => {
    const url = prompt('请输入bilibili视频链接')
    if (!url) return
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
    if (!url) return
    const vid = url.match(/douyin.com\/video\/([^/]+)/)[1];
    const { data: { iframe_code } } = await otherApi.getTiktokVideo(vid)
    console.log(iframe_code);
  }

  const addWeb = () => {
    const url = prompt('请输入网站地址')
    if (!url) return
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

  const askAI = async () => {
    const question = prompt('请输入');
    if (!question) return;
    // 使用 fetch 发送请求，添加 message 参数
    const response = await fetch(`https://sky-ai.timewishtips.cn/Sky-ai/chat/stream?message=${encodeURIComponent(question)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 获取响应的 ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let result = '';
    // 逐步读取流数据
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      // 解码并追加到结果中
      result += decoder.decode(value, { stream: true });
      // 使用 markdown-it 渲染当前的结果
      const md = new MarkdownIt({
        breaks: true // 将单个换行符转换为<br>
      });
      const renderedContent = md.render(result); // 将获取的内容渲染为 HTML
      // 追加编辑器内容
      editor.value.commands.setContent(renderedContent);

    }
  }


  watch(
      () => editor.value?.getHTML(), // 监听编辑器的 HTML 内容
      (newContent) => {
        emit('update:modelValue', newContent) // 将内容传递给父组件
      }
  )

  watch(() => editor.value?.state?.selection, () => {
    // 当选择变化时，通知所有段落检查光标位置
    emitter.emit('update-paragraph-buttons')
  }, { deep: true })

  // 组件挂载时绑定 editor 实例
  onMounted(() => {
    editorRef.value = {
      insertImage: (url) => editor.value.chain().focus().setImage({ src: url }).run(),
      getContent: () => editor.value.getHTML()
    }
    emitter.on('trigger-add-image', addImage)
    emitter.on('trigger-add-bilibili', addBilibili)
    emitter.on('trigger-add-youtube', addYoutube)
    emitter.on('trigger-add-tiktok', addTiktok)
    emitter.on('trigger-add-website', addWeb)
    emitter.on('AI-generated', askAI)
  })

  onBeforeUnmount(() => {
    emitter.off('trigger-add-image', addImage)
    emitter.off('trigger-add-bilibili', addBilibili)
    emitter.off('trigger-add-youtube', addYoutube)
    emitter.off('trigger-add-tiktok', addTiktok)
    emitter.off('trigger-add-website', addWeb)
    emitter.off('AI-generated', askAI)
    editorRef.value = null
    editor.value.destroy();
  })

  </script>

  <template>
    <input type="file" id="fileInput" style="display: none;" accept="image/*">
    <div class="sky-container">

      <div class="sky-editor" @click="handleContainerClick">
        <editor-content :editor="editor" />
      </div>

      <div v-if="editor">
        <bubble-menu
            class="sky-bubble-menu"
            :tippy-options="{ duration: 100 }"
            :editor="editor"
        >
          <tooltip text="加粗">
            <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
              <img src="../src/assets/svg/bold.svg" alt="加粗">
            </button>
          </tooltip>

          <tooltip text="斜体">
            <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
              <img src="../src/assets/svg/font-I.svg" alt="斜体">
            </button>
          </tooltip>

          <tooltip text="删除线">
            <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
              <img src="../src/assets/svg/delete.svg" alt="删除线">
            </button>
          </tooltip>

          <tooltip text="1级标题">
            <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">
              1级标题
            </button>
          </tooltip>

          <tooltip text="2级标题">
            <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">
              2级标题
            </button>
          </tooltip>

          <tooltip text="3级标题">
            <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">
              3级标题
            </button>
          </tooltip>

          <tooltip text="无序列表">
            <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }">
              无序列表
            </button>
          </tooltip>

        </bubble-menu>

  <!--      <floating-menu-->
  <!--          class="sky-floating-menu"-->
  <!--          :tippy-options="{ duration: 100 }"-->
  <!--          :editor="editor"-->
  <!--      >-->
  <!--        <button @click="addImage">上传图片</button>-->
  <!--        <button id="youtube" @click="addYoutube()">-->
  <!--          嵌入youtube视频-->
  <!--        </button>-->
  <!--        <button id="bilibili" @click="addBilibili()">-->
  <!--          嵌入bilibili视频-->
  <!--        </button>-->
  <!--        <button id="tiktok" @click="addTiktok()">-->
  <!--          嵌入抖音视频-->
  <!--        </button>-->
  <!--        <button id="web" @click="addWeb()">-->
  <!--          嵌入网站-->
  <!--        </button>-->
  <!--      </floating-menu>-->
      </div>

      <!-- 在模板中添加 InsertMenu -->
      <InsertMenu v-if="editor" />
    </div>
  </template>

  <style scoped>
  textarea {
    border: none;
    outline: none;
  }
  </style>
