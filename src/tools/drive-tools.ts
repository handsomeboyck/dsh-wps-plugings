/**
 * WPS 云盘工具定义
 * 基于 kso-skills 的 drive 服务工具
 */

import type { ToolDefinition } from './api-client.js';

/**
 * 云盘工具列表
 */
export const driveTools: ToolDefinition[] = [
  {
    name: 'drive.list_files',
    description: '列出文件夹内容。获取指定文件夹下的文件列表。',
    service: 'drive',
    parameters: [
      {
        name: 'folder_id',
        type: 'string',
        required: true,
        description: '文件夹 ID，根目录为 "0"'
      },
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: '页码，默认 1'
      },
      {
        name: 'count',
        type: 'integer',
        required: false,
        description: '每页数量，默认 20'
      },
      {
        name: 'order_by',
        type: 'string',
        required: false,
        description: '排序方式：name、time、size'
      },
      {
        name: 'order',
        type: 'string',
        required: false,
        description: '排序方向：asc、desc'
      }
    ]
  },
  {
    name: 'drive.search_files',
    description: '搜索文件。根据关键词搜索文件。',
    service: 'drive',
    parameters: [
      {
        name: 'keyword',
        type: 'string',
        required: true,
        description: '搜索关键词'
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: '文件类型过滤：file（文件）、folder（文件夹）'
      },
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: '页码，默认 1'
      },
      {
        name: 'count',
        type: 'integer',
        required: false,
        description: '每页数量，默认 20'
      }
    ]
  },
  {
    name: 'drive.get_file_info',
    description: '获取文件详情。获取指定文件的详细信息。',
    service: 'drive',
    parameters: [
      {
        name: 'file_id',
        type: 'string',
        required: true,
        description: '文件 ID'
      }
    ]
  },
  {
    name: 'drive.create_folder',
    description: '创建文件夹。在指定位置创建新文件夹。',
    service: 'drive',
    parameters: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: '文件夹名称'
      },
      {
        name: 'parent_id',
        type: 'string',
        required: true,
        description: '父文件夹 ID'
      }
    ]
  },
  {
    name: 'drive.delete_file',
    description: '删除文件。删除指定的文件或文件夹。',
    service: 'drive',
    parameters: [
      {
        name: 'file_ids',
        type: 'array',
        required: true,
        description: '要删除的文件 ID 列表'
      }
    ]
  },
  {
    name: 'drive.move_file',
    description: '移动文件。将文件移动到指定文件夹。',
    service: 'drive',
    parameters: [
      {
        name: 'file_ids',
        type: 'array',
        required: true,
        description: '要移动的文件 ID 列表'
      },
      {
        name: 'folder_id',
        type: 'string',
        required: true,
        description: '目标文件夹 ID'
      }
    ]
  },
  {
    name: 'drive.copy_file',
    description: '复制文件。复制文件到指定位置。',
    service: 'drive',
    parameters: [
      {
        name: 'file_id',
        type: 'string',
        required: true,
        description: '要复制的文件 ID'
      },
      {
        name: 'folder_id',
        type: 'string',
        required: true,
        description: '目标文件夹 ID'
      },
      {
        name: 'name',
        type: 'string',
        required: false,
        description: '新文件名称（可选）'
      }
    ]
  },
  {
    name: 'drive.rename_file',
    description: '重命名文件。修改文件或文件夹的名称。',
    service: 'drive',
    parameters: [
      {
        name: 'file_id',
        type: 'string',
        required: true,
        description: '文件 ID'
      },
      {
        name: 'name',
        type: 'string',
        required: true,
        description: '新名称'
      }
    ]
  },
  {
    name: 'drive.list_latest_items',
    description: '获取最近访问的文件。列出最近打开或编辑的文件。',
    service: 'drive',
    parameters: [
      {
        name: 'count',
        type: 'integer',
        required: false,
        description: '返回数量，默认 20'
      }
    ]
  },
  {
    name: 'drive.list_star_items',
    description: '获取收藏的文件。列出用户收藏的文件。',
    service: 'drive',
    parameters: [
      {
        name: 'count',
        type: 'integer',
        required: false,
        description: '返回数量，默认 20'
      }
    ]
  }
];

/**
 * 获取所有云盘工具
 */
export function getAllDriveTools(): ToolDefinition[] {
  return driveTools;
}
