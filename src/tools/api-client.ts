/**
 * WPS API 客户端
 * 处理与 WPS MCP 服务的通信
 */

import { ensureAuthenticated } from '../auth/browser-auth.js';
import { tokenStore } from '../auth/token-store.js';

// 配置常量
const MCP_ENDPOINT = 'https://mcp-center.wps.cn/skill_hub/mcp';
const DEFAULT_TIMEOUT = 30000;

// API 配置接口
export interface ApiClientConfig {
  mcpEndpoint?: string;
  timeout?: number;
  requestSource?: string;
  skillVersion?: string;
}

// 工具调用参数
export interface ToolCallParams {
  tool: string;
  params: Record<string, any>;
}

// API 响应接口
export interface ApiResponse {
  code: number;
  message?: string;
  data?: any;
  result?: string;
  detail?: any;
}

// 工具定义接口
export interface ToolDefinition {
  name: string;
  description: string;
  service: string;
  parameters: ParameterDefinition[];
  response?: ResponseDefinition;
}

// 参数定义接口
export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean | string;
  description: string;
  fields?: ParameterDefinition[];
}

// 响应定义接口
export interface ResponseDefinition {
  success_indicator: string;
  schema?: any;
}

/**
 * WPS API 客户端
 */
export class WpsApiClient {
  private config: Required<ApiClientConfig>;
  private token: string | null = null;
  private sessionId: string | null = null;
  private initialized = false;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      mcpEndpoint: config.mcpEndpoint || MCP_ENDPOINT,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      requestSource: config.requestSource || 'dsh-wps',
      skillVersion: config.skillVersion || '1.0.0'
    };
  }

  /**
   * 初始化客户端（获取 Token 并创建 MCP session）
   */
  async initialize(): Promise<void> {
    // 获取 token
    this.token = await ensureAuthenticated({
      requestSource: this.config.requestSource,
      skillVersion: this.config.skillVersion
    });

    // 创建 MCP session
    await this.createSession();
    this.initialized = true;
  }

  /**
   * 创建 MCP session
   * MCP 协议要求先调用 initialize 创建 session
   */
  private async createSession(): Promise<void> {
    console.log('[WPS API] 创建 MCP session...');

    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'dsh-wps',
          version: this.config.skillVersion
        }
      }
    };

    try {
      const response = await fetch(this.config.mcpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Skill-Version': this.config.skillVersion,
          'X-Request-Source': this.config.requestSource,
          'User-Agent': `dsh-wps-plugin/${this.config.skillVersion}`
        },
        body: JSON.stringify(initRequest),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Session init failed: HTTP ${response.status} ${response.statusText}`);
      }

      // 从响应头获取 session ID
      const sessionId = response.headers.get('mcp-session-id');
      if (sessionId) {
        this.sessionId = sessionId;
        console.log(`[WPS API] Session 创建成功: ${sessionId.substring(0, 20)}...`);
      } else {
        console.warn('[WPS API] 未返回 mcp-session-id 头，将尝试无 session 调用');
      }

      // 读取响应体
      const data = await response.json();
      console.log('[WPS API] Initialize 响应:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[WPS API] Session 创建失败:', error);
      throw error;
    }
  }

  /**
   * 调用 WPS 工具
   */
  async callTool(tool: string, params: Record<string, any>): Promise<ApiResponse> {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize();
    }

    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: tool,
        arguments: params
      }
    };

    console.log(`[WPS API] 调用工具: ${tool}`);
    console.log(`[WPS API] 参数:`, JSON.stringify(params, null, 2));

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'X-Skill-Version': this.config.skillVersion,
        'X-Request-Source': this.config.requestSource,
        'User-Agent': `dsh-wps-plugin/${this.config.skillVersion}`
      };

      // 添加 session ID 头
      if (this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }

      const response = await fetch(this.config.mcpEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        // 可能是 Token 过期
        if (response.status === 401 || response.status === 403) {
          console.log('[WPS API] Token 可能已过期，尝试重新授权...');
          this.token = null;
          this.sessionId = null;
          this.initialized = false;
          await this.initialize();
          
          // 重试请求
          return this.callTool(tool, params);
        }
        
        // 可能是 session 失效
        if (response.status === 400) {
          const errorText = await response.text();
          if (errorText.includes('Invalid session ID')) {
            console.log('[WPS API] Session 失效，重新创建...');
            this.sessionId = null;
            await this.createSession();
            return this.callTool(tool, params);
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as ApiResponse;
      
      console.log(`[WPS API] 响应:`, JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error(`[WPS API] 调用失败:`, error);
      throw error;
    }
  }

  /**
   * 检查响应是否成功
   */
  isSuccess(response: ApiResponse, successIndicator?: string): boolean {
    if (successIndicator) {
      // 简单的表达式求值
      const match = successIndicator.match(/^(\w+)\s*==\s*['"](.+)['"]$/);
      if (match) {
        const [, field, expected] = match;
        const value = response[field as keyof ApiResponse];
        return String(value) === expected;
      }
    }
    
    return response.code === 0;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<void> {
    this.token = null;
    this.sessionId = null;
    this.initialized = false;
    await tokenStore.clearToken();
    await this.initialize();
  }
}

/**
 * 工具定义管理器
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * 注册工具
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    console.log(`[WPS Tools] 注册工具: ${tool.name}`);
  }

  /**
   * 批量注册工具
   */
  registerAll(tools: ToolDefinition[]): void {
    tools.forEach(tool => this.register(tool));
  }

  /**
   * 获取工具定义
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 按服务过滤工具
   */
  getByService(service: string): ToolDefinition[] {
    return this.getAll().filter(tool => tool.service === service);
  }

  /**
   * 转换为 MCP 工具格式
   */
  toMcpTools(): any[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: this.convertParameters(tool.parameters),
        required: tool.parameters
          .filter(p => p.required === true)
          .map(p => p.name)
      }
    }));
  }

  /**
   * 转换参数定义
   */
  private convertParameters(params: ParameterDefinition[]): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const param of params) {
      const prop: any = {
        type: this.mapType(param.type),
        description: param.description
      };

      if (param.fields) {
        prop.properties = this.convertParameters(param.fields);
      }

      properties[param.name] = prop;
    }

    return properties;
  }

  /**
   * 类型映射
   */
  private mapType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'integer': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'array': 'array'
    };

    return typeMap[type] || 'string';
  }
}

// 单例导出
export const toolRegistry = new ToolRegistry();
export const apiClient = new WpsApiClient();
