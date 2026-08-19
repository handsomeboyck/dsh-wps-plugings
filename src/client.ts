/**
 * DSH WPS Plugin - 编程式客户端
 * 提供 initPlugin() 便捷入口，封装认证与工具调用。
 */

import { WpsApiClient, apiClient, type ApiClientConfig } from './tools/api-client.js';
import { tokenStore } from './auth/token-store.js';
import { ensureAuthenticated } from './auth/browser-auth.js';

/**
 * 认证状态
 */
export interface AuthStatus {
  authenticated: boolean;
  storageMode?: string;
}

/**
 * WPS 插件客户端
 * 封装 Token 管理、MCP Session 管理与工具调用。
 */
export class WpsPluginClient {
  private client: WpsApiClient;

  constructor(client: WpsApiClient) {
    this.client = client;
  }

  /**
   * 调用 WPS 工具
   */
  async callTool(tool: string, params: Record<string, any> = {}): Promise<any> {
    return this.client.callTool(tool, params);
  }

  /**
   * 检查当前认证状态
   */
  async checkAuth(): Promise<AuthStatus> {
    const token = await tokenStore.getToken();
    return {
      authenticated: !!token,
      storageMode: tokenStore.getStorageMode()
    };
  }

  /**
   * 触发认证（若已有有效 Token 则跳过）
   */
  async ensureAuth(): Promise<string> {
    return ensureAuthenticated({
      requestSource: 'dsh-wps',
      skillVersion: '1.0.0'
    });
  }

  /**
   * 手动刷新 Token（清除后重新授权）
   */
  async refreshToken(): Promise<string> {
    await tokenStore.clearToken();
    return this.ensureAuth();
  }

  /**
   * 获取底层 API 客户端（高级用法）
   */
  getClient(): WpsApiClient {
    return this.client;
  }
}

/**
 * 初始化插件客户端
 * @param config 可选配置
 */
export async function initPlugin(config?: ApiClientConfig): Promise<WpsPluginClient> {
  const client = config ? new WpsApiClient(config) : apiClient;
  // 尝试初始化（自动加载/触发授权）
  if (!(client as any).initialized) {
    try {
      await client.initialize();
    } catch (error) {
      // 初始化失败不致命，调用具体工具时会再次触发授权
      console.error('[WPS Plugin] 初始化失败，将在首次工具调用时重试:', error);
    }
  }
  return new WpsPluginClient(client);
}

// 便于解构使用
export const plugin = new WpsPluginClient(apiClient);
