# DSH WPS Plugin

DeepSeek Harness 金山文档 WPS 能力集成插件

## 功能特性

- 🔐 **一键授权** - 浏览器自动打开 WPS 登录页，用户登录即可完成授权
- 📝 **文档操作** - 创建、读取、编辑在线文档
- 📊 **表格操作** - 读写单元格、批量操作、查找替换
- 📁 **云盘管理** - 文件列表、搜索、创建、删除、移动
- 🔒 **安全存储** - Token 存储在系统密钥链，不明文暴露
- 🔗 **MCP 协议** - 支持标准 MCP Session 管理

## 安装

### 前置条件

- Node.js >= 18.0.0
- DeepSeek Harness (DSH) 已安装
- WPS 账号（个人或企业）

### 1. 安装 Node.js

DSH 与插件运行在 Node.js 之上，需 Node.js **>= 18.0.0**（建议安装 LTS 版本）。

**方式一：官网安装包（Windows / macOS / Linux 通用）**

前往 [nodejs.org](https://nodejs.org) 下载 **LTS** 版本安装包并安装。

**方式二：包管理器安装**

```bash
# Windows（用管理员 PowerShell 或使用 winget）
winget install OpenJS.NodeJS.LTS

# macOS（Homebrew）
brew install node

# Ubuntu / Debian
sudo apt install nodejs npm

# 使用 nvm 管理多个版本（macOS / Linux 推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts
nvm use --lts
```

**验证安装**

```bash
node --version   # 应输出 v18.0.0 或更高，例如 v20.x / v22.x
npm --version    # 应输出 v9.0.0 或更高
```

### 2. 安装 DeepSeek Harness (DSH)

DSH 通过 npm 全局安装，安装后提供 `dsh` 命令。

```bash
npm install -g @deepseek-ai/dsh
```

> 若因权限不足报错（常见于 Linux / macOS），在命令前加 `sudo`：
> ```bash
> sudo npm install -g @deepseek-ai/dsh
> ```

**验证安装**

```bash
dsh --version      # 应输出 dsh 版本号
dsh --help         # 查看可用命令
```

安装完成后，DSH 会创建默认 profile 目录（`~/.dsh/profiles/<name>`），后续插件安装都在该目录下执行。

> **找不到 `dsh` 命令？** DSH 安装后，npm 全局目录（`C:\Users\<你>\AppData\Roaming\npm`）需要在系统 PATH 中（npm 通常会自动添加）。如果安装后终端仍报 `不是内部或外部命令`，**关闭当前终端并重新打开一个新窗口**即可，不需要手动修改 PATH。

### 3. 安装插件

**方式一：从 npm 安装（推荐）**

```bash
dsh plugin --profile web add dsh-wps-plugin
```

**方式二：从 GitHub 安装**

```bash
dsh plugin --profile web add https://github.com/handsomeboyck/dsh-wps-plugings
```

**方式三：本地目录（开发调试）**

```bash
dsh plugin --profile web add /path/to/dsh-wps-plugin
```

> profile 名称以 `dsh --help` 输出的实际为准（常见为 `web`、`headless`、`tui`）；旧版本 DSH 目录可能是 `~/.dsh/profile`（无 `s`）。

### 从源码构建（可选）

```bash
cd dsh-wps-plugin
npm install
npm run build
```

### 更新插件

`dsh plugin` 会把参数原样转发给 **pnpm**（DSH 依赖 pnpm 管理插件，安装 DSH 时会一并带上）。更新插件的命令与 pnpm 完全一致：

**更新到最新版本**

```bash
dsh plugin --profile web update dsh-wps-plugin
# 或使用 pnpm 的 up 别名
dsh plugin --profile web up dsh-wps-plugin
```

**交互式选择版本**

```bash
dsh plugin --profile web update -i dsh-wps-plugin
```

**升级到指定版本**

```bash
dsh plugin --profile web add dsh-wps-plugin@0.2.0
```

**更新 profile 里的全部插件**

```bash
dsh plugin --profile web update
```

> **发布方注意**：pnpm 依据 `package.json` 的 `version` 字段判断是否有新版本。若只推送 GitHub 而未更新 `version`，`update` 可能拉不到新版本。因此每次发版都应：① 递增 `version`（如 `0.1.0` → `0.2.0`）→ ② `git push` 推送 → ③ `npm publish` 发布。使用本地目录方式开发的，只需重新 `npm run build` 并重启 DSH 即可生效，无需"更新"。

## 使用方式

### 首次授权

1. 安装插件后，首次调用 WPS 工具时会自动触发授权
2. 浏览器会打开 WPS 登录页面
3. 登录并点击「允许」完成授权
4. Token 会自动保存到系统密钥链，后续使用无需重复授权

### 调用示例

```typescript
import { initPlugin } from 'dsh-wps-plugin';

// 初始化插件
const plugin = await initPlugin();

// 列出我的云文档根目录
const files = await plugin.callTool('list_my_files', {
  page_size: 10
});

// 搜索文件
const searchResult = await plugin.callTool('search_files', {
  keyword: '报告',
  file_type: 'file',
  page_size: 5
});

// 创建文档
const newDoc = await plugin.callTool('create_file_with_content', {
  name: '我的文档.docx',
  content: '文档内容',
  file_extension: 'docx',
  parent_id: '0'  // 根目录
});

// 读取文档内容
const content = await plugin.callTool('read_file', {
  file_id: 'your_file_id_here',
  format: 'markdown'
});
```

## 支持的工具

### 文件操作工具

| 工具名称 | 功能说明 | 必需参数 |
|---------|---------|---------|
| `get_file_info` | 获取文件详情 | file_id 或 link_id 或 url |
| `search_files` | 搜索文件 | keyword |
| `list_files` | 列出文件夹内容 | parent_id |
| `list_my_files` | 列出我的云文档根目录 | 无 |
| `create_file` | 创建文件或文件夹 | name, file_type |
| `create_file_with_content` | 创建带内容的文件 | name |
| `read_file` | 读取文件内容 | file_id 或 link_id 或 url |
| `download_file` | 下载文件 | file_id 和 drive_id |
| `upload_file` | 上传文件 | name |

### 表格工具 (sheet)

| 工具名称 | 功能说明 |
|---------|---------|
| `sheet.add_row` | 添加行 |
| `sheet.add_sheet` | 添加工作表 |
| `sheet.create_conditional_format_rules` | 创建条件格式 |
| `sheet.create_data_validations` | 创建数据验证 |
| `sheet.add_chart` | 添加图表 |

### 文档工具 (wps)

| 工具名称 | 功能说明 |
|---------|---------|
| `wps.create_empty_document` | 创建空白文档 |
| `wps.read_content_control` | 读取内容控件 |
| `wps.search_replace` | 搜索替换 |
| `wps.export` | 导出文档 |

### 演示文稿工具 (wpp)

| 工具名称 | 功能说明 |
|---------|---------|
| `wpp.create_empty_presentation` | 创建空白演示文稿 |
| `wpp.read_presentation` | 读取演示文稿 |
| `wpp.insert_slide` | 插入幻灯片 |

## MCP Session 管理

插件实现了标准的 MCP Session 管理流程：

1. **初始化 Session** - 首次调用时自动创建 MCP Session
2. **Session 复用** - 后续调用复用同一 Session
3. **自动恢复** - Session 失效时自动重新创建

```
客户端 → initialize → 获取 Session ID → tools/call (携带 Session ID)
```

## 配置

### MCP 端点配置

默认 MCP 端点：`https://mcp-center.wps.cn/skill_hub/mcp`

如需修改，可在插件配置中设置：

```yaml
- id: tool-wps
  config:
    mcpEndpoint: https://your-custom-endpoint.com/mcp
```

### 认证配置

插件使用 Bearer Token 认证，Token 会自动从 WPS OAuth 流程获取并存储在系统密钥链中。

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式（监听文件变化）
npm run dev
```

## 认证流程

```
用户 → 浏览器授权 → 获取 Token → 存储到文件/密钥链 → API 调用携带 Token
```

### Token 缓存

插件支持 Token 持久化存储，无需每次启动都重新授权：

- **存储位置**：`<工作目录>/.dsh-wps-cache/token.json`
- **存储模式**：优先使用系统密钥链，降级到文件存储
- **过期处理**：Token 过期后自动清除，需要重新授权

```
首次启动 → 浏览器授权 → Token 保存到文件
再次启动 → 自动从文件加载 Token → 直接使用
Token 过期 → 自动清除 → 重新授权
```

## 故障排除

### 问题 1：授权失败

**症状**：浏览器打开后无法完成授权

**解决方案**：
1. 确保浏览器可以访问 `mcp-center.wps.cn`
2. 检查网络连接
3. 尝试清除浏览器缓存后重试

### 问题 2：Token 过期

**症状**：调用工具返回 401 错误

**解决方案**：插件会自动处理 Token 刷新，如果失败可以手动触发：

```typescript
await plugin.refreshToken();
```

### 问题 3：Session 失效

**症状**：调用工具返回 "Invalid session ID"

**解决方案**：插件会自动重新创建 Session，无需手动处理。

## 相关链接

- [金山文档 SkillHub](https://mcp-center.wps.cn)
- [DeepSeek Harness](https://github.com/deepseek-ai/dsh)
- [WPS 开放平台](https://open.wps.cn)
- [在线文档](https://www.kdocs.cn/l/cePMmBYLR35z)

## License

MIT
