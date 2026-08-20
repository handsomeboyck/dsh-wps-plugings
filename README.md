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

**验证安装（必须通过再进行下一步）**

```bash
# 关闭当前终端，重新打开一个新终端窗口，然后执行：
dsh --version      # 应输出 dsh 版本号，例如 0.1.0-rc.7
```

> ⚠️ 如果报 `dsh 不是内部或外部命令`，说明 npm 全局目录不在 PATH 中。按以下步骤修复：
>
> **Windows**：
> 1. 先确认 npm 安装目录：在 cmd 中执行 `npm root -g`，记下输出的路径（通常是 `C:\Users\<你>\AppData\Roaming\npm`）
> 2. 按 `Win + R` → 输入 `sysdm.cpl` → 回车
> 3. 点「高级」→「环境变量」→ 在**用户变量**中找到 `Path`，双击编辑
> 4. 点「新建」，粘贴上面记下的 npm 全局目录路径，确定保存
> 5. **关闭所有终端窗口，重新打开**，再执行 `dsh --version`
>
> **macOS / Linux**：
> ```bash
> # 将 npm 全局目录加入 PATH（写入 shell 配置文件，重启终端生效）
> echo 'export PATH="$(npm root -g)/../bin:$PATH"' >> ~/.bashrc
> source ~/.bashrc
> ```

安装完成后，DSH 会创建默认 profile 目录（`~/.dsh/profiles/<name>`），后续插件安装都在该目录下执行。

### 3. 安装并启用插件

插件是标准的 DSH bundle（`package.json` 声明 `dsh.bundle.patch` → `cordis.patch.yml`），
`dsh plugin add` 会自动把它加入 profile 的 `dsh.profile.bundles`，无需再手动编辑补丁。

**一键安装（Windows / macOS / Linux 通用）**

```bash
# Windows（下载 ZIP 后解压，例如到 C:\dsh-wps-plugin）
dsh plugin --profile web add C:\dsh-wps-plugin

# macOS / Linux
dsh plugin --profile web add /path/to/dsh-wps-plugin
```

然后重启 DSH：

```bash
dsh web
```

> ⚠️ 如果你曾经按旧版文档手动在 `~/.dsh/profiles/web/cordis.patch.yml` 里添加过
> `- id: tool-wps` 的覆盖块，请删除它（旧版写法会因 `name` 不匹配被跳过并打印告警）；
> 现在插件的 `cordis.patch.yml` 已用正确的 `insert` 形式自动挂载，无需任何手动补丁。

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

插件注册 **56 个核心工具**，覆盖金山文档最常用的能力（工具清单由官方
SkillHub MCP `tools/list` 生成，见 `src/core-tools.ts`，可用
`node scripts/generate-core-tools.mjs` 重新生成）。按服务分组如下：

| 服务 | 数量 | 工具 |
|------|------|------|
| 文件/云盘 | 13 | `list_my_files` `list_files` `search_files` `get_file_info` `create_file_with_content` `create_folder` `upload_new_file` `download_file` `read_file` `move_file` `copy_file` `rename_file` `list_latest_items` |
| 智能文档 otl | 6 | `otl.insert_content` `otl.convert` `otl.block_query` `otl.block_insert` `otl.block_update` `otl.block_delete` |
| 分享/协作 | 5 | `share_file` `get_share_info` `set_collaborator_permissions` `list_document_collaborators` `create_document_comment` |
| 文字 wps | 7 | `wps.create_empty_document` `wps.read_text` `wps.write_text` `wps.read_table` `wps.write_table` `wps.search_replace` `wps.export` |
| 表格 sheet | 10 | `sheet.get_sheets_info` `sheet.get_range_data` `sheet.update_range_data` `sheet.range_data_batch_update` `sheet.add_sheet` `sheet.delete_sheets` `sheet.find_range_data` `sheet.delete_range_data` `sheet.insert_rows_cols` `sheet.merge_range` |
| 演示 wpp | 4 | `wpp.create_empty_presentation` `wpp.read_slide` `wpp.write_slide` `wpp.export_pdf` |
| PDF | 4 | `pdf.get_pdf_page_count` `pdf.extract_pdf_pages` `pdf.convert` `pdf.convert_query` |
| 多维表 dbsheet | 4 | `dbsheet.get_schema` `dbsheet.list_records` `dbsheet.create_records` `dbsheet.update_records` |
| 知识库 kwiki | 2 | `kwiki.list_knowledge_views` `kwiki.list_items` |
| 版本历史 | 1 | `list_file_versions` |

> 官方 SkillHub 端点共提供 **258 个工具**（含 `aippt` AI 生成 PPT、`pdf` 翻译、
> `sheet` 图表/透视表、`dbsheet` 视图/表单/权限、`form` 等）。如需要扩展更多能力，
> 把新工具名加入 `scripts/generate-core-tools.mjs` 的 `CORE_NAMES` 后重新生成并构建即可。

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
