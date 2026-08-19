/**
 * WPS 工具集
 * 导出所有 WPS 相关工具
 */

export { sheetTools, getAllSheetTools } from './sheet-tools.js';
export { wpsTools, getAllWpsTools } from './wps-tools.js';
export { driveTools, getAllDriveTools } from './drive-tools.js';

export { WpsApiClient, ToolRegistry, apiClient, toolRegistry } from './api-client.js';
export type { ToolDefinition, ApiClientConfig, ApiResponse, ToolCallParams } from './api-client.js';

import { getAllSheetTools } from './sheet-tools.js';
import { getAllWpsTools } from './wps-tools.js';
import { getAllDriveTools } from './drive-tools.js';
import { toolRegistry } from './api-client.js';
import type { ToolDefinition } from './api-client.js';

/**
 * 注册所有 WPS 工具
 */
export function registerAllTools(): void {
  const allTools: ToolDefinition[] = [
    ...getAllSheetTools(),
    ...getAllWpsTools(),
    ...getAllDriveTools()
  ];

  toolRegistry.registerAll(allTools);
  
  console.log(`[WPS Tools] 已注册 ${allTools.length} 个工具`);
  console.log(`[WPS Tools] 表格工具: ${getAllSheetTools().length} 个`);
  console.log(`[WPS Tools] 文档工具: ${getAllWpsTools().length} 个`);
  console.log(`[WPS Tools] 云盘工具: ${getAllDriveTools().length} 个`);
}

/**
 * 获取所有工具定义（MCP 格式）
 */
export function getAllMcpTools(): any[] {
  registerAllTools();
  return toolRegistry.toMcpTools();
}
