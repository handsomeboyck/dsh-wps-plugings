/**
 * DSH WPS Cordis Plugin
 * 注册 WPS 工具到 DSH
 */

import { ensureAuthenticated } from './auth/browser-auth.js';
import { tokenStore } from './auth/token-store.js';
import { apiClient } from './tools/api-client.js';
import z from '@deepseek-ai/schemastery';

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
  },
  {
    name: 'list_latest_items',
    description: '获取最近访问的文档列表。列出最近打开或编辑的云文档。',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: '返回数量，默认 20'
        }
      },
      required: []
    }
  },
  {
    name: 'list_star_items',
    description: '获取收藏（星标）列表。列出用户收藏的云文档。',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: '返回数量，默认 20'
        }
      },
      required: []
    }
  }
];

/**
 * 解析 WPS MCP 响应
 * WPS MCP 服务将业务结果包裹在 JSON-RPC envelope 中：
 * { jsonrpc, id, result: { content: [{ type: 'text', text: '{"code":0,"message":"成功","data":{...}}' }] } }
 * 需要解出内层 JSON，并把协议层/业务层错误转成异常。
 */
function parseWpsResponse(toolName: string, response: any): any {
  // 1. JSON-RPC 协议层错误
  if (response && typeof response === 'object' && response.error) {
    const message = response.error.message || JSON.stringify(response.error);
    throw new Error(`WPS 工具 ${toolName} 调用失败: ${message}`);
  }

  // 2. 提取 content 文本块
  const content = response?.result?.content;
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error(`WPS 工具 ${toolName} 返回了无法识别的响应: ${String(JSON.stringify(response)).substring(0, 300)}`);
  }
  const text = content
    .filter((block: any) => block?.type === 'text')
    .map((block: any) => String(block.text ?? ''))
    .join('\n');

  // 3. 解析内层业务 JSON
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && typeof parsed.code === 'number' && parsed.code !== 0) {
      throw new Error(`WPS 工具 ${toolName} 调用失败 (code=${parsed.code}): ${parsed.message || '未知错误'}`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`WPS 工具 ${toolName} 调用失败`)) {
      throw error;
    }
    // text 不是 JSON，直接返回文本
    return { text };
  }
}

/**
 * 执行 WPS 工具
 */
async function executeWpsTool(toolName: string, args: Record<string, any>): Promise<any> {
  // 先确保有 token
  await getWpsToken();
  const response = await callWpsApi(toolName, args);
  return parseWpsResponse(toolName, response);
}

/**
 * WPS 插件配置
 * 注：Cordis 要求 Config 为标准 schema（schemastery），不能是普通默认值对象。
 */
const Config = z.object({
  enabled: z.boolean().default(true),
  timeoutMs: z.number().default(30000)
});

/**
 * WPS 插件注入的服务
 * 注：当前 DSH (0.1.0-rc.7) 无 systemPrompt 服务，仅注入 tools。
 */
const inject = ['tools'];

/**
 * 插件名称
 */
const name = 'tool-wps';

/**
 * WPS 插件主函数
 */
function apply(ctx: any, config: any = Config) {
  // 添加系统提示（当前 DSH 版本无 systemPrompt 服务时自动跳过）
  try {
    ctx.systemPrompt?.section?.({
      name: 'tool:wps',
      order: 120,
      text: 'Use the WPS tools (sheet.*, wps.*, drive.*) to interact with Kingsoft Office documents, spreadsheets, and cloud storage. These tools require authentication - the first use will trigger a browser login flow.'
    });
  } catch (error) {
    console.warn('[WPS Plugin] 无法注册系统提示段（可忽略）:', error);
  }

  // 注册所有 WPS 工具
  // DSH 工具契约：output.schema 约束 execute 的返回值；output.render 必须返回
  // MCP 内容块数组 [{ type: 'text', text: '...' }]，否则会报 "content is not iterable"。
  for (const toolDef of wpsToolDefinitions) {
    ctx.tools.register({
      ...toolDef,
      output: {
        // WPS 各工具返回的数据形态不同，不做结构约束
        schema: {},
        render: (_args: any, value: any) => [{
          type: 'text',
          text: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        }]
      },
      timeoutMs: config.timeoutMs,
      async execute(args: Record<string, any>) {
        return executeWpsTool(toolDef.name, args);
      }
    });
  }
}

export { apply, name, inject, Config, wpsToolDefinitions, executeWpsTool };
