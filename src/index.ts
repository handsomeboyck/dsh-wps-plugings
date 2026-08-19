/**
 * DSH WPS Plugin - 主入口
 * DeepSeek Harness 金山文档插件
 */

// 重新导出 cordis 插件
export { apply, name, inject, Config, wpsToolDefinitions, executeWpsTool } from './plugin.js';

// 重新导出认证模块
export { ensureAuthenticated, authorize } from './auth/browser-auth.js';
export { tokenStore } from './auth/token-store.js';

// 编程式客户端
export { initPlugin, WpsPluginClient, plugin, type AuthStatus } from './client.js';

// 工具定义与执行
export { getAllMcpTools, registerAllTools } from './tools/index.js';
export { apiClient, toolRegistry } from './tools/api-client.js';
export type { ApiClientConfig, ToolDefinition } from './tools/api-client.js';

// 插件版本
export const PLUGIN_VERSION = '0.1.0';
