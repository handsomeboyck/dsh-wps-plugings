/**
 * DSH WPS Cordis Plugin
 * 注册 WPS 工具到 DSH
 */

import { ensureAuthenticated } from './auth/browser-auth.js';
import { tokenStore } from './auth/token-store.js';
import { apiClient } from './tools/api-client.js';

// WPS API 配置
const EXCHANGE_URL = 'https://api.wps.cn/office/v5/ai/skill_hub/wps_auth/exchange';
const AUTH_GUIDE_URL = 'https://mcp-center.wps.cn/kdocs-auth/auth-guide';

/**
 * 调用 WPS MCP API（使用新的 API 客户端）
 */
async function callWpsApi(tool: string, params: Record<string, any>): Promise<any> {
  // 确保 API 客户端已初始化
  if (!(apiClient as any).initialized) {
    await apiClient.initialize();
  }
  // MCP 工具名称已经是正确的格式
  return apiClient.callTool(tool, params);
}

/**
 * 获取或触发 WPS 授权
 */
async function getWpsToken(): Promise<string> {
  // 尝试获取已存储的 Token
  const existingToken = await tokenStore.getToken();
  if (existingToken) {
    return existingToken;
  }

  // 需要授权 - 使用浏览器授权流程
  const { authorize } = await import('./auth/browser-auth.js');
  const result = await authorize({
    authGuideUrl: AUTH_GUIDE_URL,
    exchangeUrl: EXCHANGE_URL
  });

  if (result.success && result.token) {
    return result.token;
  }

  throw new Error(result.error || 'WPS 授权失败');
}

/**
 * WPS 工具定义
 * 使用 MCP 协议的工具
 */
const wpsToolDefinitions = [
  {
    name: 'get_file_info',
    description: '获取文件详情。获取指定文件的详细信息。',
    parameters: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: '文件 ID'
        },
        link_id: {
          type: 'string',
          description: '分享链接 ID'
        },
        url: {
          type: 'string',
          description: '文件 URL'
        },
        with_drive: {
          type: 'boolean',
          description: '是否包含 drive_id 信息',
          default: true
        }
      },
      required: []
    }
  },
  {
    name: 'search_files',
    description: '搜索文件。根据关键词搜索文件。',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '搜索关键词'
        },
        file_type: {
          type: 'string',
          description: '文件类型过滤：file（文件）、folder（文件夹）'
        },
        page_size: {
          type: 'number',
          description: '每页数量，默认 10'
        }
      },
      required: ['keyword']
    }
  },
  {
    name: 'list_files',
    description: '列出文件夹内容。获取指定文件夹下的文件列表。',
    parameters: {
      type: 'object',
      properties: {
        parent_id: {
          type: 'string',
          description: '文件夹 ID'
        },
        drive_id: {
          type: 'string',
          description: '云盘 ID'
        },
        page_size: {
          type: 'number',
          description: '每页数量，默认 20'
        }
      },
      required: []
    }
  },
  {
    name: 'list_my_files',
    description: '列出我的云文档根目录。',
    parameters: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: '每页数量，默认 20'
        }
      },
      required: []
    }
  },
  {
    name: 'create_file',
    description: '创建文件或文件夹。',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '文件名称'
        },
        file_type: {
          type: 'string',
          description: '文件类型：file（文件）、folder（文件夹）'
        },
        parent_id: {
          type: 'string',
          description: '父文件夹 ID'
        },
        drive_id: {
          type: 'string',
          description: '云盘 ID（可选）'
        }
      },
      required: ['name', 'file_type']
    }
  },
  {
    name: 'create_file_with_content',
    description: '创建带内容的文件。创建文件并写入内容。',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '文件名称'
        },
        content: {
          type: 'string',
          description: '文件内容（Markdown 格式）'
        },
        file_extension: {
          type: 'string',
          description: '文件扩展名：md, txt, docx, xlsx 等'
        },
        parent_id: {
          type: 'string',
          description: '父文件夹 ID'
        },
        drive_id: {
          type: 'string',
          description: '云盘 ID（可选）'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'read_file',
    description: '读取文件内容。获取文档中的文字内容。',
    parameters: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: '文件 ID'
        },
        link_id: {
          type: 'string',
          description: '分享链接 ID'
        },
        url: {
          type: 'string',
          description: '文件 URL'
        },
        format: {
          type: 'string',
          description: '输出格式：markdown（默认）、text'
        }
      },
      required: []
    }
  },
  {
    name: 'download_file',
    description: '下载文件。获取文件的下载链接。',
    parameters: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: '文件 ID'
        },
        drive_id: {
          type: 'string',
          description: '云盘 ID'
        },
        link_id: {
          type: 'string',
          description: '分享链接 ID'
        }
      },
      required: []
    }
  },
  {
    name: 'upload_file',
    description: '上传文件到云盘。',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '文件名称'
        },
        content_base64: {
          type: 'string',
          description: '文件内容（Base64 编码）'
        },
        content_format: {
          type: 'string',
          description: '文件格式'
        },
        parent_id: {
          type: 'string',
          description: '父文件夹 ID'
        },
        drive_id: {
          type: 'string',
          description: '云盘 ID（可选）'
        }
      },
      required: ['name']
    }
  }
];

/**
 * 执行 WPS 工具
 */
async function executeWpsTool(toolName: string, args: Record<string, any>): Promise<any> {
  // 先确保有 token
  await getWpsToken();
  return callWpsApi(toolName, args);
}

/**
 * WPS 插件配置
 */
const Config = {
  enabled: true,
  timeoutMs: 30000
};

/**
 * WPS 插件注入的服务
 */
const inject = ['tools', 'systemPrompt'];

/**
 * 插件名称
 */
const name = 'tool-wps';

/**
 * WPS 插件主函数
 */
function apply(ctx: any, config: any = Config) {
  // 添加系统提示
  ctx.systemPrompt.section({
    name: 'tool:wps',
    order: 120,
    text: 'Use the WPS tools (sheet.*, wps.*, drive.*) to interact with Kingsoft Office documents, spreadsheets, and cloud storage. These tools require authentication - the first use will trigger a browser login flow.'
  });

  // 注册所有 WPS 工具
  for (const toolDef of wpsToolDefinitions) {
    ctx.tools.register({
      ...toolDef,
      async execute(args: Record<string, any>) {
        return executeWpsTool(toolDef.name, args);
      }
    });
  }
}

export { apply, name, inject, Config, wpsToolDefinitions, executeWpsTool };
