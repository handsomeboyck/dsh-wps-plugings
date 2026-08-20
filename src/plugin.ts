/**
 * DSH WPS Cordis Plugin
 * 将 WPS 核心工具集注册到 DSH。
 *
 * 本插件以「原生 cordis bundle」方式加载（`dsh plugin add` → pnpm →
 * `dsh.profile.bundles` → loader `import(name)`），拥有完整 Node 权限，
 * 因此使用 `@deepseek-ai/dsh-tools` 的注册契约：`ctx.tools.register` 要求
 * 每个工具声明 `output`（规范输出）并返回无损 JSON。
 */

import { tokenStore } from './auth/token-store.js';
import { apiClient } from './tools/api-client.js';
import { coreTools, type CoreToolDefinition } from './core-tools.js';

// WPS API 配置
const AUTH_GUIDE_URL = 'https://mcp-center.wps.cn/kdocs-auth/auth-guide';
const EXCHANGE_URL = 'https://api.wps.cn/office/v5/ai/skill_hub/wps_auth/exchange';

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
 * 调用 WPS MCP API（使用新的 API 客户端）
 */
async function callWpsApi(tool: string, params: Record<string, any>): Promise<any> {
  // 确保 API 客户端已初始化
  if (!(apiClient as any).initialized) {
    await apiClient.initialize();
  }
  return apiClient.callTool(tool, params);
}

/**
 * 从 WPS MCP 响应中提取对模型有用的结果。
 *
 * 兼容两种信封：
 * - 标准 MCP tools/call：{ result: { content: [{ type: 'text', text }], isError } }
 * - WPS 自定义信封：{ code, message, data, result, detail }
 */
function extractWpsResult(data: any): any {
  if (data && typeof data === 'object') {
    const r = data.result;
    if (r && typeof r === 'object' && Array.isArray(r.content)) {
      const texts = r.content
        .filter((c: any) => c && c.type === 'text' && typeof c.text === 'string')
        .map((c: any) => c.text);
      if (texts.length > 0) {
        return texts.join('\n');
      }
      return r.content;
    }
    if (r !== undefined) {
      return r;
    }
  }
  return data;
}

/**
 * 渲染工具结果为模型可见的文本块。
 */
function renderWpsResult(_args: unknown, value: unknown): Array<{ type: string; text: string }> {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return [{ type: 'text', text }];
}

/**
 * 执行 WPS 工具：先确保有 token，再调用 MCP 并提取结果。
 */
async function executeWpsTool(toolName: string, args: Record<string, any>): Promise<any> {
  await getWpsToken();
  const raw = await callWpsApi(toolName, args);
  return extractWpsResult(raw);
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
    text: 'Use the WPS (Kingsoft Office) tools to work with cloud files, documents (wps.*), spreadsheets (sheet.*), presentations (wpp.*), PDFs (pdf.*), smart tables (dbsheet.*), smart docs (otl.*), and knowledge bases (kwiki.*), plus top-level file/share/version tools. Tools read/write the user\'s Kingsoft Docs cloud drive; the first use triggers a browser login to authorize Kingsoft Docs.'
  });

  // 注册核心工具集
  for (const def of coreTools) {
    ctx.tools.register({
      name: def.name,
      description: def.description,
      parameters: def.parameters,
      output: {
        // 注解-only schema：接受任意无损 JSON 值
        schema: {},
        render: renderWpsResult
      },
      async execute(args: Record<string, any>) {
        return executeWpsTool(def.name, args);
      }
    });
  }

  console.log(`[WPS Plugin] 已注册 ${coreTools.length} 个核心工具`);
}

export { apply, name, inject, Config, coreTools, executeWpsTool };
export type { CoreToolDefinition };
