/**
 * WPS 表格工具定义
 * 基于 kso-skills 的 sheet 服务工具
 */

import type { ToolDefinition } from './api-client.js';

/**
 * 表格工具列表
 */
export const sheetTools: ToolDefinition[] = [
  {
    name: 'sheet.get_range_data',
    description: '获取选区数据。获取指定工作表中某个矩形区域内的单元格数据。行列索引均为 0-based。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      },
      {
        name: 'worksheet_id',
        type: 'integer',
        required: true,
        description: '工作表 ID'
      },
      {
        name: 'range',
        type: 'object',
        required: true,
        description: '选区范围（必须为对象，即使只读取一个单元格也必须包裹在对象中传入，不可传数组），行列索引均为 0-based',
        fields: [
          { name: 'rowFrom', type: 'integer', required: true, description: '选区起始行索引' },
          { name: 'rowTo', type: 'integer', required: true, description: '选区最终行索引' },
          { name: 'colFrom', type: 'integer', required: true, description: '选区起始列索引' },
          { name: 'colTo', type: 'integer', required: true, description: '选区最终列索引' }
        ]
      }
    ],
    response: {
      success_indicator: "result == 'ok'",
      schema: {
        result: { type: 'string', description: "'ok' 表示成功" },
        detail: {
          type: 'object',
          fields: [
            { name: 'rangeData', type: 'array', description: '单元格数据数组' }
          ]
        }
      }
    }
  },
  {
    name: 'sheet.update_range_data',
    description: '更新选区数据。向指定工作表的某个矩形区域写入数据。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      },
      {
        name: 'worksheet_id',
        type: 'integer',
        required: true,
        description: '工作表 ID'
      },
      {
        name: 'range',
        type: 'object',
        required: true,
        description: '选区范围',
        fields: [
          { name: 'rowFrom', type: 'integer', required: true, description: '起始行索引' },
          { name: 'rowTo', type: 'integer', required: true, description: '最终行索引' },
          { name: 'colFrom', type: 'integer', required: true, description: '起始列索引' },
          { name: 'colTo', type: 'integer', required: true, description: '最终列索引' }
        ]
      },
      {
        name: 'values',
        type: 'array',
        required: true,
        description: '要写入的数据，二维数组格式'
      }
    ]
  },
  {
    name: 'sheet.get_sheets_info',
    description: '获取工作表信息。返回工作表列表及其基本信息。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      }
    ]
  },
  {
    name: 'sheet.add_sheet',
    description: '新增工作表。在当前表格中添加一个新的工作表。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      },
      {
        name: 'title',
        type: 'string',
        required: false,
        description: '工作表名称'
      }
    ]
  },
  {
    name: 'sheet.delete_sheets',
    description: '删除工作表。删除指定的工作表。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      },
      {
        name: 'sheet_ids',
        type: 'array',
        required: true,
        description: '要删除的工作表 ID 列表'
      }
    ]
  },
  {
    name: 'sheet.find_range_data',
    description: '查找数据。在指定范围内搜索符合特定条件的单元格。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      },
      {
        name: 'worksheet_id',
        type: 'integer',
        required: true,
        description: '工作表 ID'
      },
      {
        name: 'find',
        type: 'string',
        required: true,
        description: '要查找的内容'
      },
      {
        name: 'range',
        type: 'object',
        required: false,
        description: '查找范围（可选，不传则搜索整个工作表）',
        fields: [
          { name: 'rowFrom', type: 'integer', required: true, description: '起始行索引' },
          { name: 'rowTo', type: 'integer', required: true, description: '最终行索引' },
          { name: 'colFrom', type: 'integer', required: true, description: '起始列索引' },
          { name: 'colTo', type: 'integer', required: true, description: '最终列索引' }
        ]
      }
    ]
  },
  {
    name: 'sheet.range_data_batch_update',
    description: '批量更新数据。一次操作更新多个不连续的单元格区域。',
    service: 'sheet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文档 URL'
      },
      {
        name: 'link_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '分享链接 ID'
      },
      {
        name: 'file_id',
        type: 'string',
        required: 'url|link_id|file_id',
        description: '文件 ID'
      },
      {
        name: 'worksheet_id',
        type: 'integer',
        required: true,
        description: '工作表 ID'
      },
      {
        name: 'data',
        type: 'array',
        required: true,
        description: '批量更新数据数组，每项包含 range 和 values'
      }
    ]
  }
];

/**
 * 获取所有表格工具
 */
export function getAllSheetTools(): ToolDefinition[] {
  return sheetTools;
}
