/**
 * DSH WPS Cordis Plugin
 * 将 WPS 核心工具集注册到 DSH。
 *
 * 本插件以「原生 cordis bundle」方式加载（`dsh plugin add` → pnpm →
 * `dsh.profile.bundles` → loader `import(name)`），拥有完整 Node 权限。
 * 使用 DSH 工具契约：`ctx.tools.register` 要求声明 `output`（规范输出），
 * 且 `output.render` 必须返回内容块数组 `[{ type: 'text', text }]`。
 */

import z from '@deepseek-ai/schemastery';
import { tokenStore } from './auth/token-store.js';
import { apiClient } from './tools/api-client.js';
import { coreTools } from './core-tools.js';

// WPS API 配置
const EXCHANGE_URL = 'https://api.wps.cn/office/v5/ai/skill_hub/wps_auth/exchange';
const AUTH_GUIDE_URL = 'https://mcp-center.wps.cn/kdocs-auth/auth-guide';

/**
 * 调用 WPS MCP API（使用 API 客户端）
 */
async function callWpsApi(tool: string, params: Record<string, any>): Promise<any> {
  // 确保 API 客户端已初始化
  if (!(apiClient as any).initialized) {
    await apiClient.initialize();
  }
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
 * 执行 WPS 工具：先确保有 token，再调用 MCP 并解析结果。
 */
async function executeWpsTool(toolName: string, args: Record<string, any>): Promise<any> {
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
 * 注：当前 DSH 无 systemPrompt 服务，仅注入 tools。
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
  // 注册核心工具集
  // DeepSeek 模型要求工具名匹配 ^[a-zA-Z0-9_-]+$，不允许点号。
  // 注册时将点号替换为下划线（otl.insert_content → otl_insert_content），
  // 调用 MCP 时还原回原始点号名。
  for (const def of coreTools) {
    const mcpName = def.name; // 原始 MCP 工具名（含点号）
    const dshName = mcpName.replace(/\./g, '_'); // DSH 注册名（下划线）

    ctx.tools.register({
      name: dshName,
      description: def.description,
      parameters: def.parameters,
      output: {
        schema: {},
        render: (_args: any, value: any) => [{
          type: 'text',
          text: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        }]
      },
      timeoutMs: config.timeoutMs,
      async execute(args: Record<string, any>) {
        return executeWpsTool(mcpName, args); // 用原始点号名调用 MCP
      }
    });
  }

  console.log(`[WPS Plugin] 已注册 ${coreTools.length} 个核心工具`);
}

export { apply, name, inject, Config, coreTools, executeWpsTool };
