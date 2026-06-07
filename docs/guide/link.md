# 链接

Sky Tiptap 支持链接的添加和管理。

## 添加链接

1. 选中要添加链接的文本
2. 点击工具栏或悬浮菜单中的链接按钮
3. 输入链接地址
4. 确认即可

## 打开链接

默认情况下，链接不会在点击时自动打开。需要按住 **Ctrl**（Mac 上是 **Cmd**）键的同时点击链接，即可在新标签页中打开。

这个设计是为了避免在编辑过程中误触链接跳转。

如果业务侧需要自定义跳转、链接预览、权限判断或点击埋点，可以监听 `linkClick` 事件。调用 `preventDefault()` 后，编辑器不会继续执行默认的 Ctrl/Cmd 点击打开行为。

```vue
<script setup>
const handleLinkClick = (linkClickEvent) => {
  if (!linkClickEvent.href) return

  linkClickEvent.preventDefault()

  window.open(linkClickEvent.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <sky-tiptap
    v-model="content"
    @link-click="handleLinkClick"
  />
</template>
```

## 链接配置

链接使用 Tiptap 的 Link 扩展，默认配置：

```javascript
Link.configure({
  openOnClick: false  // 禁止点击直接打开
})
```

## Markdown 输入

也可以通过 Markdown 语法快速添加链接：

```
[链接文字](https://example.com)
```

输入完成后按空格键即可转换。
