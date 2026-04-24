# Sky Tiptap - 测试报告

> 项目: `@Chelase/sky-tiptap`  
> 版本: `1.2.0`  
> 测试日期: 2026-04-24  
> 测试环境: WSL (Node.js v22.22.2)

---

## 1. 执行摘要

| 测试类型 | 状态 | 备注 |
|---------|------|------|
| 构建测试 | ✅ 通过 | `npm run build` 成功 |
| 单元测试 | ✅ 29/29 通过 | Vitest + jsdom |
| 依赖安全审查 | ⚠️ 7 个漏洞 | 见下文 |
| 静态代码审查 | ⚠️ 发现问题 | 见下文 |

---

## 2. 构建测试

### 结果

```
vite v6.4.1 building for production...
transforming...
✓ 344 modules transformed.
rendering chunks...
computing gzip size...
dist/sky-tiptap.css       22.70 kB │ gzip:   3.70 kB
dist/sky-tiptap.es.js  2,049.23 kB │ gzip: 555.37 kB
dist/sky-tiptap.umd.js  1,434.73 kB │ gzip: 453.28 kB
✓ built in 10.71s
```

### 构建产物

| 文件 | 大小 | gzip |
|------|------|------|
| `dist/sky-tiptap.es.js` | 2.0 MB | 555 kB |
| `dist/sky-tiptap.umd.js` | 1.4 MB | 453 kB |
| `dist/sky-tiptap.css` | 23 KB | 3.7 KB |

### 构建问题
- **WSL 兼容性**: 初始 `node_modules` 在 Windows 下安装，缺少 `@rollup/rollup-linux-x64-gnu`，需要补免安装。
- **包体积过大**: ESM 包 2MB（gzip 555KB），主要是因为 `highlight.js` 和 `lowlight` 的全量语法实体被打包。建议考虑按需引入语言或使用动态加载。

---

## 3. 单元测试

### 测试框架
- **Vitest** v4.1.5
- **@vue/test-utils**
- **jsdom**

### 测试覆盖

| 测试文件 | 用例数 | 通过 | 覆盖范围 |
|---------|--------|------|---------|
| `icons.test.js` | 3 | 3 | 图标导出、getIcon、Icon组件 |
| `emitter.test.js` | 3 | 3 | mitt 事件发射、多监听器、卸载 |
| `ToolbarButton.test.js` | 5 | 5 | 按钮渲染、点击、禁用态、激活态 |
| `extensions.test.js` | 5 | 5 | VideoEmbed、Iframe、CustomParagraph 扩展配置 |
| `SkyTiptap.test.js` | 7 | 7 | 组件挂载、Props、事件、暴露方法 |
| `main.test.js` | 6 | 6 | 入口导出、向后兼容函数 |

### 测试结果

```
✓ src/__tests__/ToolbarButton.test.js (5 tests) 98ms
✓ src/__tests__/icons.test.js (3 tests) 7ms
✓ src/__tests__/extensions.test.js (5 tests) 6ms
✓ src/__tests__/emitter.test.js (3 tests) 11ms
✓ src/__tests__/SkyTiptap.test.js (7 tests) 85ms
✓ src/__tests__/main.test.js (6 tests) 7ms

Test Files  6 passed (6)
     Tests  29 passed (29)
```

---

## 4. 依赖安全审查 (`npm audit`)

### 漏洞清单

| 严重级 | 数量 | 包 |
|--------|------|-----|
| Critical | 1 | `handlebars` - JavaScript Injection via AST Type Confusion |
| High | 4 | `immutable` (Prototype Pollution), `picomatch` (ReDoS), `rollup` (Path Traversal), `vite` (Arbitrary File Read) |
| Moderate | 2 | `brace-expansion` (DoS), `markdown-it` (ReDoS) |

### 修复建议
1. 执行 `npm audit fix` 自动修复部分漏洞。
2. 关键漏洞在 `handlebars`（流程图模板）和 `vite`（开发服务器），建议更新到最新版本。
3. `markdown-it` 可升级到 v14.1.1 或更高版本修复 ReDoS。

---

## 5. 静态代码审查

### 5.1 配置问题

#### `vite.config.js` - server 配置位置错误
```js
// 错误：server 不应在 build 内
build: {
    server: { host: '0.0.0.0', port: 5174 },
    ...
}

// 正确：server 是独立配置
server: { host: '0.0.0.0', port: 5174 },
build: { ... }
```
**已修复**: 测试过程中已调整 `vite.config.js`。

### 5.2 SSR 兼容性问题

#### `src/main.js`
全局 `document.addEventListener` 在服务端渲染（SSR）时会抛出错误：
```js
document.addEventListener('click', () => {
  emitter.emit('hide-all-paragraph-buttons')
})
```
**建议**: 添加 `typeof document !== 'undefined'` 判断或将此逻辑移至组件内。

### 5.3 重复导出

#### `src/main.js`
`SkyTiptap` 和 `SkyTiptapNew` 实际上是同一个组件：
```js
export { SkyTiptapComponent as SkyTiptap }
export { default as SkyTiptapNew } from './components/SkyTiptap.vue'
```
**建议**: 统一导出名称，移除重复。

### 5.4 代码一致性

#### `src/utils/index.js`
存在与 `src/config/default.js` 重复的 `TipTapPlugin` 配置，但 `package.json` 未将 `src/utils/index.js` 作为入口。该文件实际上已被弃用。
**建议**: 删除或合并到 `src/config/default.js`。

### 5.5 组件问题

#### `CustomParagraphComponent.vue`
使用了 `v-html="icons.plus"` 渲染 SVG，如果 `icons.plus` 包含恶意内容可能导致 XSS。虽然当前是硬编码的 SVG，但建议将图标渲染改为组件形式或确保内容可信。

#### `InsertMenu.vue`
存在 `insert('table')` 事件处理的缺失：在 `handleInsert` 方法中，`table` 和 `divider` 缺少 case分支，只在模板中直接调用。

---

## 6. 功能验证

### 6.1 已验证功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 组件挂载 | ✅ | SkyTiptap 可正常初始化 |
| Props 传递 | ✅ | modelValue, theme, showToolbar, placeholder |
| 事件发射 | ✅ | uploadPhoto, update:modelValue |
| 图标系统 | ✅ | 21 个 SVG 图标正常导出 |
| 工具栏按钮 | ✅ | 点击、禁用、激活态 |
| 扩展注册 | ✅ | VideoEmbed, Iframe, CustomParagraph |
| 事件总线 | ✅ | emitter emit/on/off 正常工作 |

### 6.2 需运行时验证的功能

以下功能需要在浏览器环境中手动验证：

- Tiptap 编辑器核心功能（粘贴、输入规则、Markdown 转换）
- 代码块语法高亮
- 图片上传与插入
- 视频嵌入（Bilibili、YouTube、抖音）
- 浮动菜单（Bubble Menu）
- AI 生成功能（需 Sky-AI 后端）
- 表格插入与操作

---

## 7. 性能关注点

1. **包体积**: 2MB ESM 包过大，建议通过以下方式优化：
   - 将 `highlight.js` 语法实体改为按需加载
   - 分割代码块组件为独立 chunk

2. **重复 CSS**: 构建产物中输出了两份相同的 CSS。

---

## 8. 建议修复清单

### 高优先级
- [ ] 更新 `handlebars` 包修复 Critical 漏洞
- [ ] 更新 `vite` 到最新版本修复路径遍历漏洞
- [ ] 修复 `src/main.js` 中的 SSR 兼容性问题

### 中优先级
- [ ] 优化构建产物大小（动态引入 highlight.js 语言）
- [ ] 清理 `src/utils/index.js` 中的重复配置
- [ ] 统一 `SkyTiptap` 和 `SkyTiptapNew` 导出

### 低优先级
- [ ] 为 `InsertMenu.vue` 补充完整的 `insert()` case 分支
- [ ] 考虑替换 `v-html` 图标为 Vue 组件
- [ ] 增加 E2E 测试（Playwright）覆盖核心编辑功能

---

## 9. 测试文件清单

此次测试创建了以下测试文件：

```
src/__tests__/
├── icons.test.js          # 图标模块测试
├── emitter.test.js         # 事件总线测试
├── ToolbarButton.test.js   # 工具栏按钮组件测试
├── extensions.test.js      # Tiptap 扩展测试
├── SkyTiptap.test.js       # 主组件测试
└── main.test.js            # 入口导出测试
```

---

## 10. 测试脚本

```bash
# 构建
npm run build

# 单元测试
npm test

# 安全审查
npm audit
```

---

*本报告由 Hermes Agent 自动生成。*
