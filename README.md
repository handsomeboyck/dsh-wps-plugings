# DSH WPS Plugin

> DeepSeek Harness（DSH）金山文档 / WPS 能力集成插件。
> 装上之后，你可以直接在 **DeepSeek Harness 对话里**用自然语言操作 WPS 云文档：列文件、读文档、创建/上传文档、搜索文件等。

[![npm](https://img.shields.io/badge/dsh--wps--plugin-0.2.0-blue)](https://github.com/handsomeboyck/dsh-wps-plugings)
[![license](https://img.shields.io/badge/license-AGPL--3.0--or--Commercial-blue)](./LICENSE)

---

## 目录

- [功能特性](#功能特性)
- [前置条件](#前置条件)
- [安装](#安装)
  - [方式一：对话式安装（推荐，最简单）](#方式一对话式安装推荐最简单)
  - [方式二：命令行手动安装](#方式二命令行手动安装)
  - [方式三：本地源码安装（开发者）](#方式三本地源码安装开发者)
- [首次授权](#首次授权)
- [使用方式](#使用方式)
  - [对话中使用（推荐）](#对话中使用推荐)
  - [编程式调用（API）](#编程式调用api)
- [内置工具一览](#内置工具一览)
- [认证与 Token 管理](#认证与-token-管理)
  - [存储位置](#存储位置)
  - [切换账号 / 重新授权](#切换账号--重新授权)
- [故障排除](#故障排除)
- [开发](#开发)
- [相关链接](#相关链接)
- [License](#license)

---

## 功能特性

- 🔐 **一键浏览器授权**：首次调用工具时自动打开 WPS 登录页，登录即完成授权，无需手动配 Key
- 📁 **云盘管理**：列出/搜索/创建/上传/下载云文档，读取文档内容
- ⭐ **个性化列表**：最近访问、收藏（星标）列表
- 🔒 **安全存储**：Token 优先存入系统密钥链（Windows 凭据管理器 / macOS Keychain），不明文落盘
- 🔗 **MCP 协议**：完整 MCP Session 管理（initialize → tools/call），Session 失效自动重建
- ♻️ **自动续期**：Token 过期或 401/403 时自动清除并重新拉起授权

---

## 前置条件

| 依赖 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | >= 18.0.0 | 建议 LTS（20/22） |
| DeepSeek Harness (DSH) | 0.1.0-rc.x | `npm install -g @deepseek-ai/dsh` |
| WPS 账号 | 个人账号 | 授权走 WPS OAuth，登录一次即可 |

```bash
# 安装 DSH（全局）
npm install -g @deepseek-ai/dsh

# 验证
dsh --version
```

---

## 安装

### 方式一：对话式安装（推荐，最简单）

**是的——直接通过对话让 DeepSeek Harness 帮你安装即可。**

你只需要在 DSH 对话里说一句：

> 「请帮我安装 dsh-wps-plugin 插件」

DSH 智能体会自动完成：

1. 把插件包安装到 profile：`dsh plugin --profile web add <包源>`（`<包源>` 为 npm 包名 / Git 地址 / 本地路径任一）
   - ℹ️ **前提**：直接写包名 `dsh-wps-plugin` 时，DSH 会让 pnpm 从 npm 官方源解析。本包**已发布到 npm**（`dsh-wps-plugin@0.2.0`），因此「一句话安装」直接成立；也可改用 Git 地址或本地路径（见方式二 / 方式三）。
   - 插件的 bundle 会自动在 profile 组合中注册 `tool-wps` 行（`cordis.patch.yml` 内置 `insert`），**无需再手动编辑** `bundles` 或 `cordis.patch.yml`。
2. 提示你**重启 DSH**（写入 `~/.dsh` 系统目录的操作可能需要你在弹窗中批准）

**注意两点：**

- ⚠️ **重启必须由你手动完成**：DSH 智能体运行在 DSH 进程内部，无法自己重启宿主进程。按提示关掉终端里的 DSH 再重新运行 `dsh web`，然后回到对话说一声「重启好了」。
- 重启后**第一次调用 WPS 工具**时，浏览器会自动弹出 WPS 登录页，登录新账号即完成授权。

### 方式二：命令行手动安装

不想用对话，也可以手动执行（与方式一的对话自动步骤等价）：

```bash
# 1. 安装插件包（三选一）
dsh plugin --profile web add dsh-wps-plugin                                # 从 npm（已发布）
dsh plugin --profile web add https://github.com/handsomeboyck/dsh-wps-plugings.git   # 从 Git
dsh plugin --profile web add /path/to/dsh-wps-plugin                        # 本地路径 / link

# 2. 重启 DSH
dsh web
```

> 说明：`dsh plugin` 命令本质是「把参数转发给 profile 目录下的 pnpm」，并把声明了
> `dsh.bundle` 的包自动写入 `dsh.profile.bundles`；插件自带的 `cordis.patch.yml` 会以
> `insert` 形式自动注册 `tool-wps` 行。因此**无需手动编辑** `bundles` 或 `cordis.patch.yml`。

### 方式三：本地源码安装（开发者）

```bash
git clone https://github.com/handsomeboyck/dsh-wps-plugings.git
cd dsh-wps-plugings
npm install
npm run build          # 编译 src → dist

# 以 link 方式接入 DSH
dsh plugin --profile web add link:$PWD
# 重启 dsh web 即可（bundle 自动注册 tool-wps 行）
```

---

## 首次授权

1. 重启 DSH 后，第一次调用任意 WPS 工具（例如「看看我最近的文件」）
2. 浏览器自动打开 WPS 授权页（`mcp-center.wps.cn`）
3. 登录你的 WPS 账号并授权
4. 页面显示「授权成功」后即可关闭；Token 自动保存，之后无需重复授权

> 授权轮询最长等待 **5 分钟**，请在该时间内完成登录。

---

## 使用方式

### 对话中使用（推荐）

装上之后，用自然语言即可，例如：

| 你说的话 | 实际调用的工具 |
| --- | --- |
| 「看看我最近的文件」 | `list_latest_items` |
| 「列出我的云文档根目录」 | `list_my_files` |
| 「搜一下含『周报』的文件」 | `search_files` |
| 「读一下这个文档」 | `read_file` |
| 「新建一个 docx 文档，内容是……」 | `create_file_with_content` |
| 「把这份周报上传到 WPS」 | `upload_file` / `create_file_with_content` |
| 「看下这个文件的详情 / 下载链接」 | `get_file_info` / `download_file` |

### 编程式调用（API）

```typescript
import { initPlugin } from 'dsh-wps-plugin';

const plugin = await initPlugin();

// 列出我的云文档根目录
const files = await plugin.callTool('list_my_files', { page_size: 10 });

// 搜索文件
const searchResult = await plugin.callTool('search_files', {
  keyword: '周报',
  file_type: 'file',
  page_size: 5
});

// 创建带内容的文档（root 目录 parent_id 为 "0"）
const newDoc = await plugin.callTool('create_file_with_content', {
  name: '我的文档',
  content: '# 标题\n\n正文内容',
  file_extension: 'docx',   // 支持 .otl/.docx/.pdf/.xls/.xlsx/.ksheet/.dbt
  parent_id: '0'
});

// 读取文档内容
const content = await plugin.callTool('read_file', {
  file_id: 'your_file_id_here',
  format: 'markdown'
});
```

---

## 内置工具一览

插件默认向 DSH 注册以下 **56 个核心工具**（由官方 SkillHub MCP `tools/list` 生成，参数 schema 自动净化到 DSH 强制子集）：

| 服务 | 数量 | 工具 |
| --- | --- | --- |
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

> 官方 SkillHub 端点共提供 **258 个工具**（含 `aippt` AI 生成 PPT、`pdf` 翻译、`sheet` 图表/透视表、`dbsheet` 视图/表单/权限、`form` 等）。如需扩展更多能力，把新工具名加入 `scripts/generate-core-tools.mjs` 的 `CORE_NAMES`，再 `node scripts/generate-core-tools.mjs && npm run build` 重新生成并构建即可。

---

## 认证与 Token 管理

### 存储位置

按优先级降级：

1. **系统密钥链**（keytar）：
   - Windows：凭据管理器，Target `dsh-wps/user-token`
   - macOS：Keychain；Linux：Secret Service
2. **文件**：`<DSH 工作目录>/.dsh-wps-cache/token.json`
3. **内存**（进程重启后需重新授权）

### 切换账号 / 重新授权

换了 WPS 账号想重新认证时：

```cmd
:: Windows：删除旧凭据
cmdkey /delete:dsh-wps/user-token
```

然后 **重启 DSH**，重启后第一次调用 WPS 工具会自动弹出浏览器，用新账号登录即可。

> 为什么不删也「不生效」？运行中的 DSH 进程会在内存里缓存旧 Token，仅删除凭据不够，必须重启进程清空缓存——这是切换账号的标准步骤。

### 自动处理

- Token 过期（或 API 返回 401/403）：自动清除并重新拉起浏览器授权
- MCP Session 失效（`Invalid session ID`）：自动重建，无需人工干预

---

## 故障排除

| 症状 | 原因 | 解决 |
| --- | --- | --- |
| 浏览器没弹出 / 授权超时 | 未登录或网络问题 | 确认能访问 `mcp-center.wps.cn`，重新触发一次工具调用 |
| 调工具返回 401/403 | Token 失效 | 插件会自动重授权；仍失败则删除凭据 + 重启 DSH |
| 显示的还是旧账号数据 | 进程内存缓存旧 Token | 删除凭据（`cmdkey /delete:dsh-wps/user-token`）并**重启 DSH** |
| 插件没生效（没有 WPS 工具） | 插件未安装或未重启 | 确认 `dsh plugin --profile web add dsh-wps-plugin` 已执行，并**重启 `dsh web`** |
| `dsh` 命令找不到 | npm 全局目录不在 PATH | 将 `npm root -g` 目录加入 PATH 后重开终端 |

---

## 开发

```bash
npm install        # 安装依赖
npm run build      # 构建（tsc：src → dist）
npm run dev        # 监听模式开发
```

目录结构：

```
dsh-wps-plugin/
├── src/
│   ├── auth/          # 浏览器 OAuth 授权 + Token 存储
│   ├── tools/         # MCP API 客户端与工具定义
│   ├── core-tools.ts  # 56 个核心工具定义（官方 tools/list 生成）
│   ├── client.ts      # 编程式客户端（initPlugin / refreshToken）
│   ├── index.ts
│   └── plugin.ts      # Cordis 插件入口（apply / Config）
├── scripts/           # 工具定义生成器 + 官方 tools/list 快照
├── cordis.patch.yml   # bundle patch 层（insert 注册 tool-wps 行）
├── dist/              # 构建产物
└── package.json       # dsh.bundle.patch 声明
```

---

## 相关链接

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [金山文档 SkillHub / MCP 中心](https://mcp-center.wps.cn)
- [WPS 开放平台](https://open.wps.cn)
- [本仓库](https://github.com/handsomeboyck/dsh-wps-plugings)

## License（双许可）

本软件采用**双许可（Dual Licensing）**模式：

- **开源许可（默认）**：[AGPL-3.0-only](https://www.gnu.org/licenses/agpl-3.0.html)，完整条款见 [`LICENSE`](./LICENSE)。可免费使用、修改、分发，但衍生作品必须开源，SaaS 场景须公开源码。
- **商业授权**：如需在闭源商业产品中集成/销售，或以 SaaS 形式提供而不履行 AGPL 义务，必须事先获得作者书面商业授权，详见 [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md)（联系邮箱：839567748@qq.com）。

> 未经商业授权，不得闭源商用。
