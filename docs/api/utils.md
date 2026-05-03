# 工具函数

## getContent

获取编辑器当前内容。

```javascript
import { getContent } from '@Chelase/sky-tiptap'

const html = getContent()
console.log(html) // '<p>Hello World</p>'
```

**返回值：** `string` - 编辑器内容的 HTML 字符串

## insertImage

插入单张图片。

```javascript
import { insertImage } from '@Chelase/sky-tiptap'

insertImage('https://example.com/image.png')
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | 图片 URL |

## insertImages

批量插入图片。

```javascript
import { insertImages } from '@Chelase/sky-tiptap'

insertImages([
  'https://example.com/one.png',
  'https://example.com/two.png'
])
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `urls` | `string[]` | 图片 URL 数组 |

## 使用场景

### 图片上传完成后插入

```javascript
import { insertImages } from '@Chelase/sky-tiptap'

const handleUploadPhoto = async (files) => {
  const urls = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadPhoto(formData)
      return data[0]
    })
  )

  insertImages(urls)
}
```

### 在 Vue 组件外使用

由于工具函数内部通过事件总线通信，可以在 Vue 组件外部使用：

```javascript
import { insertImage, getContent } from '@Chelase/sky-tiptap'

// 在任意 JS 文件中
function addCoverImage(url) {
  insertImage(url)
}

function saveContent() {
  const html = getContent()
  // 保存到服务器...
}
```

### 配合 window.skyTiptapEditor

如果需要更底层的控制，可以直接使用全局编辑器实例：

```javascript
const editor = window.skyTiptapEditor

// 获取 HTML
const html = editor.getHTML()

// 获取 JSON 结构
const json = editor.getJSON()

// 获取纯文本
const text = editor.getText()

// 执行命令
editor.chain().focus().toggleBold().run()

// 判断是否有某个标记
const isBold = editor.isActive('bold')
```