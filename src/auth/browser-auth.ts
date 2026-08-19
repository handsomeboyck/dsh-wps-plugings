/**
 * 浏览器授权模块
 * 处理 WPS OAuth 授权流程
 */

import { createServer, type Server } from 'http';
import { URL } from 'url';
import { randomUUID } from 'crypto';
import { tokenStore, type TokenInfo } from './token-store.js';

// 配置常量
const AUTH_GUIDE_BASE_URL = 'https://mcp-center.wps.cn/kdocs-auth/auth-guide';
const EXCHANGE_URL = 'https://api.wps.cn/office/v5/ai/skill_hub/wps_auth/exchange';
const DEFAULT_TIMEOUT = 300000; // 5 分钟
const POLL_INTERVAL = 1000; // 1 秒

// 授权配置接口
export interface AuthConfig {
  authGuideUrl?: string;
  exchangeUrl?: string;
  timeout?: number;
  port?: number;
  requestSource?: string;
  skillVersion?: string;
}

// 授权结果接口
export interface AuthResult {
  success: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * 浏览器授权器
 */
export class BrowserAuth {
  private config: Required<AuthConfig>;
  private server: Server | null = null;
  private abortController: AbortController | null = null;

  constructor(config: AuthConfig = {}) {
    this.config = {
      authGuideUrl: config.authGuideUrl || AUTH_GUIDE_BASE_URL,
      exchangeUrl: config.exchangeUrl || EXCHANGE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      port: config.port || 0,
      requestSource: config.requestSource || 'dsh-wps',
      skillVersion: config.skillVersion || '1.0.0'
    };
  }

  /**
   * 开始浏览器授权流程
   */
  async authorize(): Promise<AuthResult> {
    console.log('[WPS Auth] 开始授权流程...');

    // 生成唯一授权码
    const authCode = randomUUID();
    console.log(`[WPS Auth] 生成授权码: ${authCode.substring(0, 8)}...`);

    // 构造授权 URL
    const authUrl = `${this.config.authGuideUrl}?auth_code=${authCode}`;
    console.log(`[WPS Auth] 授权 URL: ${authUrl}`);

    // 启动本地回调服务器
    const { server, port } = await this.startCallbackServer(authCode);
    this.server = server;

    // 打开浏览器
    await this.openBrowser(authUrl);

    console.log(`[WPS Auth] 等待用户授权... (最长 ${this.config.timeout / 1000 / 60} 分钟)`);

    // 轮询等待 Token
    try {
      const result = await this.pollForToken(authCode);
      
      if (result.success && result.token) {
        // 保存 Token
        await tokenStore.saveToken(result.token, result.expiresIn);
        console.log('[WPS Auth] 授权成功！');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[WPS Auth] 授权失败:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      // 关闭服务器
      this.stopCallbackServer();
    }
  }

  /**
   * 启动本地回调服务器
   */
  private async startCallbackServer(authCode: string): Promise<{ server: Server; port: number }> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        // 处理 CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // 返回一个简单的页面
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>WPS 授权</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                     display: flex; justify-content: center; align-items: center; 
                     height: 100vh; margin: 0; background: #f5f5f5; }
              .card { background: white; padding: 40px; border-radius: 12px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .success { color: #52c41a; font-size: 48px; margin-bottom: 20px; }
              h1 { margin: 0 0 10px 0; color: #333; }
              p { color: #666; margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success">✓</div>
              <h1>授权成功</h1>
              <p>您已成功授权金山文档</p>
              <p>可以关闭此页面返回 DeepSeek Harness</p>
            </div>
          </body>
          </html>
        `);
      });

      server.listen(this.config.port, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          console.log(`[WPS Auth] 本地服务器已启动: http://127.0.0.1:${addr.port}`);
          resolve({ server, port: addr.port });
        } else {
          reject(new Error('无法获取服务器地址'));
        }
      });

      server.on('error', reject);
    });
  }

  /**
   * 停止本地回调服务器
   */
  private stopCallbackServer(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * 打开浏览器
   */
  private async openBrowser(url: string): Promise<void> {
    const { platform } = process;
    
    try {
      // 尝试使用 open 包
      const open = (await import('open')).default;
      await open(url);
    } catch {
      // 降级使用系统命令
      let command: string;
      let args: string[];

      switch (platform) {
        case 'win32':
          command = 'rundll32';
          args = ['url.dll,FileProtocolHandler', url];
          break;
        case 'darwin':
          command = 'open';
          args = [url];
          break;
        default:
          command = 'xdg-open';
          args = [url];
          break;
      }

      const { execSync } = await import('child_process');
      execSync(`${command} ${args.join(' ')}`, { stdio: 'ignore' });
    }
  }

  /**
   * 轮询等待 Token
   */
  private async pollForToken(authCode: string): Promise<AuthResult> {
    const deadline = Date.now() + this.config.timeout;
    let pollCount = 0;

    while (Date.now() < deadline) {
      pollCount++;
      
      try {
        const response = await fetch(this.config.exchangeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `dsh-wps-plugin/${this.config.skillVersion}`
          },
          body: JSON.stringify({ code: authCode })
        });

        if (!response.ok) {
          console.log(`[WPS Auth] 轮询 #${pollCount}: HTTP ${response.status}`);
          await this.sleep(POLL_INTERVAL);
          continue;
        }

        const data = await response.json() as any;
        const code = data.code || data.data?.code;
        const token = data.token || data.data?.token;
        const expiresIn = data.expires_in || data.data?.expires_in;

        if (code === 200 && token) {
          return {
            success: true,
            token,
            expiresIn
          };
        }

        if (code === 403) {
          return {
            success: false,
            error: '企业账号授权被拒绝，请使用个人账号'
          };
        }

        if (code === 409) {
          return {
            success: false,
            error: '本次授权已取消，请重新授权'
          };
        }

        // 继续轮询
        if (pollCount % 5 === 0) {
          console.log(`[WPS Auth] 轮询 #${pollCount}: 等待用户登录...`);
        }
      } catch (error) {
        console.log(`[WPS Auth] 轮询 #${pollCount}: 网络错误，重试中...`);
      }

      await this.sleep(POLL_INTERVAL);
    }

    return {
      success: false,
      error: '授权超时，请重新尝试'
    };
  }

  /**
   * 等待指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 取消授权
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.stopCallbackServer();
  }
}

/**
 * 快速授权函数
 */
export async function authorize(config?: AuthConfig): Promise<AuthResult> {
  const auth = new BrowserAuth(config);
  return auth.authorize();
}

/**
 * 检查并确保已授权
 */
export async function ensureAuthenticated(config?: AuthConfig): Promise<string> {
  // 尝试获取已存储的 Token
  const existingToken = await tokenStore.getToken();
  if (existingToken) {
    console.log('[WPS Auth] 使用已存储的 Token');
    return existingToken;
  }

  // 需要重新授权
  console.log('[WPS Auth] 需要授权，请在浏览器中完成登录...');
  const result = await authorize(config);

  if (result.success && result.token) {
    return result.token;
  }

  throw new Error(result.error || '授权失败');
}
