/**
 * WPS 文档工具定义
 * 基于 kso-skills 的 wps 服务工具
 */

import type { ToolDefinition } from './api-client.js';

/**
 * 文档工具列表
 */
export const wpsTools: ToolDefinition[] = [
  {
    name: 'wps.create_empty_document',
    description: '创建空白在线文字文档。在指定目录下创建一个空白的在线文字文档。',
    service: 'wps',
    parameters: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: '文档名称（不含后缀）'
      },
      {
        name: 'parent_id',
        type: 'string',
        required: true,
        description: '目标文件夹 ID'
      },
      {
        name: 'group_id',
        type: 'number',
        required: false,
        description: '团队 gid，默认 0'
      },
      {
        name: 'template_id',
        type: 'number',
        required: false,
        description: '模板 tid，默认 0'
      }
    ]
  },
  {
    name: 'wps.doc_read_text',
    description: '读取文档文本内容。获取文档中的文字内容。',
    service: 'wps',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|file_id',
        description: '文档 URL'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|file_id',
        description: '文件 ID'
      }
    ]
  },
  {
    name: 'wps.doc_write_text',
    description: '写入文档文本内容。向文档中写入或追加文字。',
    service: 'wps',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|file_id',
        description: '文档 URL'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|file_id',
        description: '文件 ID'
      },
      {
        name: 'content',
        type: 'string',
        required: true,
        description: '要写入的文本内容'
      },
      {
        name: 'position',
        type: 'string',
        required: false,
        description: '写入位置：start（开头）、end（末尾）、指定位置'
      }
    ]
  },
  {
    name: 'wps.doc_read_table',
    description: '读取文档中的表格。获取文档中表格的内容。',
    service: 'wps',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|file_id',
        description: '文档 URL'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|file_id',
        description: '文件 ID'
      },
      {
        name: 'table_index',
        type: 'integer',
        required: false,
        description: '表格索引（从 0 开始），不传则返回所有表格'
      }
    ]
  },
  {
    name: 'wps.doc_write_table',
    description: '向文档中插入表格。在文档指定位置插入一个新表格。',
    service: 'wps',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|file_id',
        description: '文档 URL'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|file_id',
        description: '文件 ID'
      },
      {
        name: 'rows',
        type: 'integer',
        required: true,
        description: '表格行数'
      },
      {
        name: 'cols',
        type: 'integer',
        required: true,
        description: '表格列数'
      },
      {
        name: 'data',
        type: 'array',
        required: false,
        description: '表格数据（二维数组）'
      },
      {
        name: 'position',
        type: 'string',
        required: false,
        description: '插入位置'
      }
    ]
  },
  {
    name: 'wps.doc_search_replace',
    description: '查找替换。在文档中查找并替换指定内容。',
    service: 'wps',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|file_id',
        description: '文档 URL'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|file_id',
        description: '文件 ID'
      },
      {
        name: 'find',
        type: 'string',
        required: true,
        description: '要查找的内容'
      },
      {
        name: 'replace',
        type: 'string',
        required: true,
        description: '替换为的内容'
      },
      {
        name: 'regex',
        type: 'boolean',
        required: false,
        description: '是否使用正则表达式'
      }
    ]
  },
  {
    name: 'wps.export',
    description: '导出文档。将文档导出为其他格式（如 PDF、Word 等）。',
    service: 'wps',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|file_id',
        description: '文档 URL'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|file_id',
        description: '文件 ID'
      },
      {
        name: 'format',
        type: 'string',
        required: true,
        description: '导出格式：pdf、docx、xlsx、pptx 等'
      }
    ]
  }
];

/**
 * 获取所有文档工具
 */
export function getAllWpsTools(): ToolDefinition[] {
  return wpsTools;
}
