/**
 * Sky Tiptap - 块插入兼容层
 *
 * 块的类型知识已经收进 src/config/block-catalog.js，
 * 这里只保留历史导出，避免破坏 `main.js` 与既有调用方。
 */

export {
  createParagraph,
  createHeading,
  createList,
  createQuote,
  createDivider,
  createCodeBlock,
  createTable,
  createColumnList,
  EXTERNAL_BLOCK_TYPES,
  getBlockEntry,
  listBlockEntries,
  createBlockContent,
  triggerExternalBlock,
  insertBlock,
} from '../config/block-catalog'
