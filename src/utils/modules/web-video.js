import { Node, mergeAttributes } from '@tiptap/core';

const Video = Node.create({
    name: 'video', // 节点名称
    group: 'block', // 属于块级节点
    selectable: true, // 可选中
    draggable: true, // 可拖动
    atom: true, // 作为单个单元处理

    // 定义节点属性
    addAttributes() {
        return {
            src: {
                default: null, // 视频链接
            },
            width: {
                default: 640, // 默认宽度
            },
            height: {
                default: 360, // 默认高度
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
                }),
            },
        ];
    },

    // 渲染 HTML
    renderHTML({ HTMLAttributes }) {
        return ['iframe', mergeAttributes(HTMLAttributes)];
    },

    // 自定义节点视图
    addNodeView() {
        return ({ node }) => {
            const div = document.createElement('div');
            div.className = 'video-container'; // 添加 CSS 类名

            const iframe = document.createElement('iframe');
            iframe.src = node.attrs.src; // 设置视频链接
            iframe.width = node.attrs.width; // 设置宽度
            iframe.height = node.attrs.height; // 设置高度
            iframe.allowFullscreen = true; // 允许全屏
            iframe.frameBorder = '0'; // 去除边框

            div.appendChild(iframe);
            return {
                dom: div,
            };
        };
    },
});

export default Video;