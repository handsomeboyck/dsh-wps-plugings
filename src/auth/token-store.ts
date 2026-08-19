/**
 * Token 安全存储模块
 * 优先使用系统密钥链，降级到文件存储
 */

import { createRequire } from 'module';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const require = createRequire(import.meta.url);

// 服务标识
const SERVICE_NAME = 'dsh-wps';
const ACCOUNT_NAME = 'user-token';

// 文件存储路径 - 使用当前工作目录下的缓存目录
const TOKEN_DIR = join(process.cwd(), '.dsh-wps-cache');
const TOKEN_FILE = join(TOKEN_DIR, 'token.json');

// Token 信息接口
export interface TokenInfo {
  token: string;
  expiresIn?: number;
  obtainedAt: number;
}

/**
 * Token 存储器
 */
export class TokenStore {
  private keytar: any;
  private memoryCache: TokenInfo | null = null;
  private storageMode: 'keytar' | 'file' | 'memory' = 'memory';

  constructor() {
    // 尝试加载 keytar
    try {
      this.keytar = require('keytar');
      this.storageMode = 'keytar';
      console.log('[WPS Plugin] 使用系统密钥链存储 Token');
    } catch {
      // keytar 不可用，使用文件存储
      this.storageMode = 'file';
      console.log('[WPS Plugin] 使用文件存储 Token');
    }
  }

  /**
   * 确保存储目录存在
   */
  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(TOKEN_DIR, { recursive: true });
    } catch (error) {
      console.error('[WPS Plugin] 创建存储目录失败:', error);
    }
  }

  /**
   * 保存 Token 到文件
   */
  private async saveToFile(tokenInfo: TokenInfo): Promise<boolean> {
    try {
      await this.ensureDir();
      await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2), 'utf-8');
      console.log('[WPS Plugin] Token 已保存到文件:', TOKEN_FILE);
      return true;
    } catch (error) {
      console.error('[WPS Plugin] 保存 Token 到文件失败:', error);
      return false;
    }
  }

  /**
   * 从文件加载 Token
   */
  private async loadFromFile(): Promise<TokenInfo | null> {
    try {
      const data = await fs.readFile(TOKEN_FILE, 'utf-8');
      const tokenInfo: TokenInfo = JSON.parse(data);
      console.log('[WPS Plugin] 从文件加载 Token 成功');
      return tokenInfo;
    } catch (error) {
      // 文件不存在或读取失败
      return null;
    }
  }

  /**
   * 从文件删除 Token
   */
  private async deleteFromFile(): Promise<boolean> {
    try {
      await fs.unlink(TOKEN_FILE);
      console.log('[WPS Plugin] Token 文件已删除');
      return true;
    } catch (error) {
      // 文件不存在
      return true;
    }
  }

  /**
   * 保存 Token
   */
  async saveToken(token: string, expiresIn?: number): Promise<boolean> {
    const tokenInfo: TokenInfo = {
      token,
      expiresIn,
      obtainedAt: Date.now()
    };

    // 更新内存缓存
    this.memoryCache = tokenInfo;

    // 1. 尝试保存到系统密钥链
    if (this.keytar) {
      try {
        await this.keytar.setPassword(
          SERVICE_NAME,
          ACCOUNT_NAME,
          JSON.stringify(tokenInfo)
        );
        console.log('[WPS Plugin] Token 已保存到系统密钥链');
        return true;
      } catch (error) {
        console.error('[WPS Plugin] 保存 Token 到密钥链失败:', error);
      }
    }

    // 2. 降级：保存到文件
    if (this.storageMode === 'file') {
      return this.saveToFile(tokenInfo);
    }

    // 3. 最后降级：仅内存存储
    console.warn('[WPS Plugin] 使用内存存储 Token（重启后需重新授权）');
    return true;
  }

  /**
   * 加载 Token
   */
  async loadToken(): Promise<TokenInfo | null> {
    // 1. 优先从内存缓存获取
    if (this.memoryCache) {
      return this.memoryCache;
    }

    // 2. 尝试从系统密钥链获取
    if (this.keytar) {
      try {
        const data = await this.keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (data) {
          const tokenInfo: TokenInfo = JSON.parse(data);
          this.memoryCache = tokenInfo;
          return tokenInfo;
        }
      } catch (error) {
        console.error('[WPS Plugin] 从密钥链加载 Token 失败:', error);
      }
    }

    // 3. 尝试从文件获取
    if (this.storageMode === 'file') {
      const tokenInfo = await this.loadFromFile();
      if (tokenInfo) {
        this.memoryCache = tokenInfo;
        return tokenInfo;
      }
    }

    return null;
  }

  /**
   * 清除存储的 Token
   */
  async clearToken(): Promise<boolean> {
    this.memoryCache = null;

    // 从系统密钥链删除
    if (this.keytar) {
      try {
        await this.keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        console.log('[WPS Plugin] Token 已从密钥链清除');
      } catch (error) {
        console.error('[WPS Plugin] 从密钥链清除 Token 失败:', error);
      }
    }

    // 从文件删除
    if (this.storageMode === 'file') {
      await this.deleteFromFile();
    }

    return true;
  }

  /**
   * 检查 Token 是否有效（未过期）
   */
  async isTokenValid(): Promise<boolean> {
    const tokenInfo = await this.loadToken();
    if (!tokenInfo) {
      return false;
    }

    // 如果没有过期时间，假设有效
    if (!tokenInfo.expiresIn) {
      return true;
    }

    // 计算过期时间（提前 5 分钟判定为过期）
    const expiresAt = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000) - (5 * 60 * 1000);
    return Date.now() < expiresAt;
  }

  /**
   * 获取当前 Token（如果有效）
   */
  async getToken(): Promise<string | null> {
    const tokenInfo = await this.loadToken();
    if (!tokenInfo) {
      return null;
    }

    if (await this.isTokenValid()) {
      return tokenInfo.token;
    }

    // Token 已过期，清除
    console.log('[WPS Token] Token 已过期，清除...');
    await this.clearToken();
    return null;
  }

  /**
   * 获取存储模式
   */
  getStorageMode(): string {
    return this.storageMode;
  }
}

// 单例导出
export const tokenStore = new TokenStore();
