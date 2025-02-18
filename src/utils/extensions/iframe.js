import { Node } from '@tiptap/core';

const Iframe = Node.create({
    name: 'iframe', // 节点名称
    group: 'block', // 块级节点
    selectable: true, // 可选中
    draggable: true, // 可拖动
    atom: true, // 作为单个单元处理

    // 定义节点属性
    addAttributes() {
        return {
            src: {
                default: null, // iframe 的 src 属性
            },
            width: {
                default: 640, // 默认宽度
            },
            height: {
                default: 360, // 默认高度
            },
            frameborder: {
                default: '0', // 默认边框
            },
            allowfullscreen: {
                default: 'true', // 是否允许全屏
            },
        };
    },

    // 解析 HTML
    parseHTML() {
        return [
            {
                tag: 'iframe', // 匹配 iframe 标签
                getAttrs: (node) => ({
                    src: node.getAttribute('src'),
                    width: node.getAttribute('width'),
                    height: node.getAttribute('height'),
                    frameborder: node.getAttribute('frameborder'),
                    allowfullscreen: node.getAttribute('allowfullscreen'),
                }),
            },
        ];
    },

    // 渲染 HTML
    renderHTML({ node }) {
        return [
            'iframe',
            {
                src: node.attrs.src,
                width: node.attrs.width,
                height: node.attrs.height,
                frameborder: node.attrs.frameborder,
                allowfullscreen: node.attrs.allowfullscreen,
            },
        ];
    },

    // 自定义节点视图
    addNodeView() {
        return ({ node }) => {
            const div = document.createElement('div');
            div.className = 'iframe-container'; // 添加 CSS 类名

            const iframe = document.createElement('iframe');
            iframe.src = node.attrs.src; // 设置 iframe 的 src
            iframe.width = node.attrs.width; // 设置宽度
            iframe.height = node.attrs.height; // 设置高度
            iframe.frameBorder = node.attrs.frameborder; // 设置边框
            iframe.allowFullscreen = node.attrs.allowfullscreen; // 允许全屏

            div.appendChild(iframe);
            return {
                dom: div,
            };
        };
    },
});

export default Iframe;