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

### 安装插件

**方式一：从 npm 安装（推荐）**

```bash
# 在 DSH profile 目录中执行
cd ~/.dsh/profile
dsh plugin add dsh-wps-plugin
```

**方式二：从 GitHub 安装**

```bash
cd ~/.dsh/profile
dsh plugin add https://github.com/<your-org>/dsh-wps-plugin
```

**方式三：本地目录（开发调试）**

```bash
cd ~/.dsh/profile
dsh plugin add ./dsh-wps-plugin
```

### 从源码构建（可选）

```bash
cd dsh-wps-plugin
npm install
npm run build
```

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
