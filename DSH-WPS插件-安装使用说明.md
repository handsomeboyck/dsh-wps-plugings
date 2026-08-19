# DSH WPS 插件 安装与使用说明

> DeepSeek Harness 金山文档（WPS）能力集成插件
> 版本：0.1.0

---

## 一、插件简介

**DSH WPS Plugin** 是一个运行在 DeepSeek Harness (DSH) 环境中的插件，让 AI 助手能够直接操作你的**金山文档（WPS 云文档）**，包括：

- 📝 **在线文档**：创建、读取、编辑文字文档
- 📊 **在线表格**：读写单元格、批量操作、查找替换
- 📑 **演示文稿**：创建、读取、编辑 PPT
- 📁 **云盘管理**：文件列表、搜索、创建、移动、删除

**核心能力**：通过 MCP（Model Context Protocol）协议与 WPS 云端服务通信，让 AI 能像你一样管理和操作云端文档。

---

## 二、环境要求

在开始之前，请确保满足以下条件：

| 项目 | 要求 |
|------|------|
| **Node.js** | ≥ 18.0.0（建议 LTS 版本） |
| **DeepSeek Harness** | 已安装并配置完成 |
| **WPS 账号** | 个人账号或企业账号均可 |
| **网络** | 可正常访问 `mcp-center.wps.cn` |

> 💡 可在命令行检查版本：
> ```bash
> node --version   # 应输出 v18.0.0 或更高
> dsh --version    # 应输出 dsh 版本号
> ```

---

## 三、安装步骤

### 3.0 安装 Node.js 与 DeepSeek Harness（首次使用）

**Step 1：安装 Node.js（≥ 18.0.0）**

前往 [nodejs.org](https://nodejs.org) 下载 **LTS** 版本安装包并安装；或使用包管理器：

```bash
# Windows
winget install OpenJS.NodeJS.LTS

# macOS
brew install node

# Ubuntu / Debian
sudo apt install nodejs npm
```

验证：`node --version`

**Step 2：安装 DeepSeek Harness (DSH)**

DSH 通过 npm 全局安装：

```bash
npm install -g @deepseek-ai/dsh
```

> Linux / macOS 若权限不足，加 `sudo`：`sudo npm install -g @deepseek-ai/dsh`

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

### 3.1 获取插件源码

### 3.2 安装插件到 DSH

**方式一：下载 ZIP 安装（最简单）**

1. 打开 https://github.com/handsomeboyck/dsh-wps-plugings
2. 点绿色「Code」→「Download ZIP」
3. 解压到本地，例如 `C:\dsh-wps-plugin`
4. 执行：

```bash
dsh plugin --profile web add C:\dsh-wps-plugin
```

**方式二：本地目录安装**

```bash
dsh plugin --profile web add /path/to/dsh-wps-plugin
```

> profile 名称以 `dsh --help` 输出的实际为准（常见为 `web`）。

### 3.3 验证安装

安装成功后，重启 DSH，插件会自动注册，AI 助手即可调用 WPS 相关工具。

### 3.4 更新插件

重新下载最新 ZIP 包，解压覆盖原目录，然后重启 DSH 即可。

---

## 四、首次授权

首次使用 WPS 工具时，需要进行一次授权：

1. **触发授权**：AI 调用任意 WPS 工具（如「列出我的云文档」）时，会自动触发授权
2. **浏览器跳转**：系统会自动打开浏览器，跳转到 WPS 登录页面
3. **登录账号**：使用你的 WPS 账号登录
4. **确认授权**：点击「允许」完成授权
5. **自动保存**：授权成功后，Token 会自动缓存，**之后无需重复授权**

> 🔒 **安全说明**：Token 会优先保存到系统密钥链，若不可用则降级保存到本地文件（`<工作目录>/.dsh-wps-cache/token.json`），不会明文暴露在对话中。

---

## 五、使用方式

### 5.1 对话式使用

安装并授权后，直接对 AI 说：

- 「帮我列出我的云文档」
- 「搜索包含"周报"的文件」
- 「创建一个文档，内容是……」
- 「读取文档 https://www.kdocs.cn/l/xxxx 的内容」

AI 会自动调用对应的 WPS 工具来完成你的指令。

### 5.2 编程式调用（开发者）

```typescript
import { initPlugin } from 'dsh-wps-plugin';

// 初始化插件
const plugin = await initPlugin();

// 列出我的云文档根目录
const files = await plugin.callTool('list_my_files', {
  page_size: 10
});

// 搜索文件
const result = await plugin.callTool('search_files', {
  keyword: '报告',
  file_type: 'file',
  page_size: 5
});

// 创建文档
const newDoc = await plugin.callTool('create_file_with_content', {
  name: '我的文档.docx',
  content: '这是文档内容',
  file_extension: 'docx',
  parent_id: '0'   // "0" 表示云文档根目录
});

// 读取文档内容
const content = await plugin.callTool('read_file', {
  file_id: 'your_file_id_here',
  format: 'markdown'
});
```

---

## 六、支持的工具

### 6.1 文件操作工具

| 工具名称 | 功能说明 | 必需参数 |
|---------|---------|---------|
| `get_file_info` | 获取文件详情 | file_id / link_id / url 三选一 |
| `search_files` | 搜索文件 | keyword |
| `list_files` | 列出文件夹内容 | parent_id |
| `list_my_files` | 列出我的云文档根目录 | 无 |
| `create_file` | 创建文件或文件夹 | name, file_type |
| `create_file_with_content` | 创建带内容的文件 | name |
| `read_file` | 读取文件内容 | file_id / link_id / url |
| `download_file` | 下载文件 | file_id + drive_id |
| `upload_file` | 上传文件 | name |

### 6.2 表格工具（sheet）

| 工具名称 | 功能说明 |
|---------|---------|
| `sheet.add_row` | 添加行 |
| `sheet.add_sheet` | 添加工作表 |
| `sheet.create_conditional_format_rules` | 创建条件格式 |
| `sheet.create_data_validations` | 创建数据验证 |
| `sheet.add_chart` | 添加图表 |

### 6.3 文档工具（wps）

| 工具名称 | 功能说明 |
|---------|---------|
| `wps.create_empty_document` | 创建空白文档 |
| `wps.read_content_control` | 读取内容控件 |
| `wps.search_replace` | 搜索替换文本 |
| `wps.export` | 导出文档 |

### 6.4 演示文稿工具（wpp）

| 工具名称 | 功能说明 |
|---------|---------|
| `wpp.create_empty_presentation` | 创建空白演示文稿 |
| `wpp.read_presentation` | 读取演示文稿 |
| `wpp.insert_slide` | 插入幻灯片 |

---

## 七、工作原理

### 7.1 MCP Session 管理

插件实现了标准 MCP 协议，调用流程如下：

```
客户端 → initialize（创建 Session）→ 获取 Session ID → tools/call（携带 Session ID）
```

- **自动创建**：首次调用时自动创建 MCP Session
- **Session 复用**：后续调用复用同一 Session，无需重复创建
- **自动恢复**：Session 失效时自动重新创建，无需人工干预

### 7.2 Token 缓存机制

```
首次启动 → 浏览器授权 → Token 保存到文件/密钥链
再次启动 → 自动加载 Token → 直接使用，无需重新授权
Token 过期 → 自动清除 → 触发重新授权
```

- **存储位置**：`<工作目录>/.dsh-wps-cache/token.json`
- **存储优先级**：系统密钥链 → 文件存储 → 内存（最后兜底）

---

## 八、配置说明

### 8.1 MCP 端点

默认端点：`https://mcp-center.wps.cn/skill_hub/mcp`

如需修改，编辑 `cordis.patch.yml`：

```yaml
- id: tool-wps
  config:
    mcpEndpoint: https://your-custom-endpoint.com/mcp
```

### 8.2 工具超时

默认超时时间为 30 秒，可在 `cordis.patch.yml` 中调整：

```yaml
- id: tool-wps
  config:
    tool-wps:
      enabled: true
      timeoutMs: 30000   # 单位：毫秒
```

---

## 九、故障排除

### 问题 1：授权失败

**症状**：浏览器打开后无法完成授权，或一直停留在登录页。

**解决方法**：
1. 确保浏览器能正常访问 `mcp-center.wps.cn`
2. 检查网络连接是否正常
3. 清除浏览器缓存后重试
4. 尝试使用无痕模式重新授权

### 问题 2：Token 过期

**症状**：调用工具时返回 `401` 错误。

**解决方法**：
- 插件会自动刷新 Token
- 若自动刷新失败，可手动触发：

```typescript
await plugin.refreshToken();
```

### 问题 3：Session 失效

**症状**：调用工具返回 "Invalid session ID"。

**解决方法**：
- 插件会自动重新创建 Session，无需手动处理
- 若持续报错，可重启 DSH 环境

### 问题 4：无法访问云文档

**症状**：读取或操作文档时报权限错误。

**解决方法**：
1. 确认文档的分享权限是否允许你的账号访问
2. 确认账号是否有该文档/文件夹的操作权限
3. 使用正确的 `file_id` 或 `link_id`

---

## 十、安全与隐私

- 🔐 **Token 安全存储**：优先使用系统密钥链，不明文保存
- 🔒 **权限最小化**：仅在你授权后访问你的云文档
- 📄 **操作可控**：所有操作均通过你授权的账号执行，可在 WPS 账号中查看操作记录

---

## 十一、相关链接

- [金山文档 SkillHub](https://mcp-center.wps.cn)
- [DeepSeek Harness](https://github.com/deepseek-ai/dsh)
- [WPS 开放平台](https://open.wps.cn)

---

## License

MIT
