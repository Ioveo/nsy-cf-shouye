# Cloudflare Pages 部署与配置完全手册

本手册专门针对本项目（天才猫软件中心 / NSY 官网与下载系统）的 Cloudflare Pages 部署流程编写，包含从 Git 仓库连接、构建参数配置、存储绑定（R2/D1）、机密环境变量设置到常见避坑要点的完整指南。

---

## 目录

1. [一、进入 Pages 部署流程](#一进入-pages-部署流程)
2. [二、构建设置（关键参数）](#二构建设置关键参数)
3. [三、存储绑定配置（R2 与 D1）](#三存储绑定配置r2-与-d1)
4. [四、环境变量与机密配置](#四环境变量与机密配置)
5. [五、触发重新部署生效](#五触发重新部署生效)
6. [六、生产环境与预览环境隔离注意事项](#六生产环境与预览环境隔离注意事项)
7. [七、常见避坑与故障排查（FAQ）](#七常见避坑与故障排查faq)

---

## 一、进入 Pages 部署流程

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 在左侧导航栏点击 **Compute (Workers 和 Pages)**。
3. 点击 **创建 (Create)** 按钮。
4. **重要操作**：滚动到页面底部，找到 **Pages** 入口（提示文案通常为：*“想部署 Pages？开始使用”* 或 *“Deploy with Cloudflare Pages”*）。
5. 点击 **连接到 Git (Connect to Git)**。
6. 授权并选择你的 GitHub 仓库（例如 `Ioveo/nsy-cf-shouye`）。

---

## 二、构建设置（关键参数）

在选择分支（默认 `main`）后，进入构建配置页面，请严格按照下表填写：

| 配置项 | 填写值 | 说明 |
| :--- | :--- | :--- |
| **框架预设 (Framework preset)** | **无 (None)** | 纯静态资源 + Functions 架构，无需预设编译框架 |
| **构建命令 (Build command)** | **留空** | 无需执行任何打包命令，直接部署 |
| **构建输出目录 (Build output directory)** | **`public`** | 静态页面、样式和前端脚本所在目录 |
| **根目录 (高级) (Root directory)** | **留空（仓库根目录）** | ⚠️ **必须留空，切勿填写 `/functions/`** |

### ⚠️ 避坑提醒（重要）：

> **特别注意**：
> 在“根目录 (高级)”一栏中，**千万不要填写 `/functions/`**！
> 本项目的结构为：
> ```text
> 仓库根目录 /
> ├── functions/       <-- Pages 后台 API 函数目录
> ├── public/          <-- 静态网页文件目录
> └── ...
> ```
> Cloudflare Pages 默认会在“根目录”下一同寻找 `public/` 和 `functions/`。如果将根目录设为 `/functions/`，系统将无法正确识别 `public` 静态资源与同级函数，导致构建异常或 404！请保持其**留空**。

---

## 三、存储绑定配置（R2 与 D1）

点击**保存并部署**（首次部署可能由于尚未添加绑定而功能受限，部署完成后进入项目主页）。

进入项目路径：**设置 (Settings) → 函数 (Functions) → 绑定 (Bindings)**（或 **设置 → 绑定**）。

### 1. R2 存储桶绑定（必配）

* **类型**：R2 存储桶绑定 (R2 bucket binding)
* **变量名称**：**`SOFTWARE_BUCKET`**（⚠️ 必须严格大写且完全一致，代码中硬编码依赖此名称）
* **绑定存储桶**：选择准备好的正式桶 **`dy-ldms-downloads`**

> **用途**：用于存储安装包、热更新补丁、`version.json`、`history.json`、图片与音视频素材。

---

### 2. D1 数据库绑定（必配）

* **类型**：D1 数据库绑定 (D1 database binding)
* **变量名称**：**`DB`**（⚠️ 必须大写为 `DB`）
* **绑定数据库**：选择创建好的 D1 数据库（例如 `dy-ldms-download-db`）

> **用途**：文章发布系统、素材管理资产库、软件下载量实时统计均依赖此数据库。

#### 💡 D1 数据库初始化（必须执行一次）：
在绑定之前或之后，必须进入 Cloudflare 控制台的 **D1 数据库 → 对应数据库 → 控制台 (Console)** 中，执行本项目根目录的 `schema.sql` 完成建表：

```sql
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);

CREATE TABLE IF NOT EXISTS article_software (
  article_id TEXT NOT NULL,
  software_id TEXT NOT NULL,
  PRIMARY KEY (article_id, software_id)
);

CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

CREATE TABLE IF NOT EXISTS release_stats (
  release_id TEXT PRIMARY KEY,
  download_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS r2_assets (
  id TEXT PRIMARY KEY,
  storage_id TEXT NOT NULL DEFAULT 'default',
  bucket TEXT NOT NULL DEFAULT '',
  key TEXT NOT NULL,
  kind TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT NOT NULL DEFAULT '',
  public_url TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  ref_type TEXT NOT NULL DEFAULT '',
  ref_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(storage_id, key)
);

CREATE INDEX IF NOT EXISTS idx_r2_assets_kind_status ON r2_assets(kind, status, updated_at);
```

---

## 四、环境变量与机密配置

进入路径：**设置 (Settings) → 变量和机密 (Variables and Secrets)**。

### 1. 机密 (Secret) 类型（点击“加密/Encrypt”保护）

| 变量名 | 类型 | 说明与示例 |
| :--- | :--- | :--- |
| **`ADMIN_PASSWORD`** | **机密 (Secret)** | 后台管理员登录密码，请设置强密码 |
| **`ADMIN_TOKEN_SECRET`** | **机密 (Secret)** | 后台 Session Token HMAC 签名密钥，建议填写 32 位以上随机字符串 |
| **`STORAGE_SECRET`** | **机密 (Secret)** | 多 R2 账户加密密钥（用于后台存储授权加密），建议填写长随机字符串 |

### 2. 普通环境变量 (Environment Variable) 类型

| 变量名 | 填写值 | 说明 |
| :--- | :--- | :--- |
| **`MANIFEST_KEY`** | **`releases/manifest.json`** | 版本元数据清单文件在 R2 中的存储路径 |
| **`PUBURL`** | *（选填，如 `https://files.yourdomain.com`）* | 如果你的 R2 绑定了自定义公共域名或 CDN 域名，请填写，直链会优先使用此域名 |

---

## 五、触发重新部署生效

> ⚠️ **高能预警**：
> Cloudflare Pages 的所有**存储绑定（Bindings）**和**变量机密（Variables/Secrets）**在修改后，**不会对已有部署实时生效**！
> 
> **必须重新部署一次**：
> 1. 点击进入 **部署 (Deployments)** 标签页。
> 2. 找到最新的一次部署，点击右侧的 **查看详情 (View details)**。
> 3. 点击右上角的 **管理部署 → 重试部署 (Retry deployment)**，或者向 GitHub 提交一次新的 commit 触发自动构建。
> 4. 新的构建实例启动后，所有的 R2/D1/机密才会成功注入运行环境！

---

## 六、生产环境与预览环境隔离注意事项

1. **生产 (Production) 与预览 (Preview) 必须分开配置**：
   * Cloudflare Pages 的“生产环境”和“预览环境”拥有完全独立的绑定与变量面板。
   * 如果开启了 Git 分支预览功能（PR 或非 main 分支构建），请务必在“预览环境”的 Tab 里同样配置一遍相应的绑定与变量，否则预览站的后台登录与文件上传会报错 500。
2. **推荐为预览环境配置测试桶**：
   * 生产环境 R2 绑定：`dy-ldms-downloads`（正式发布包与线上图片）。
   * 预览环境 R2 绑定：建议新建并绑定 `dy-ldms-downloads-dev` 测试桶，避免在开发/预览分支调试时误删或污染线上正式数据。

---

## 七、常见避坑与故障排查（FAQ）

### Q1: `wrangler.toml` 里能加 `pages_build_output_dir` 吗？
**绝对不能加！**
如果 `wrangler.toml` 中配置了 `pages_build_output_dir`，Pages 会判定该项目完全由本地配置文件托管，导致在 Cloudflare 控制台网页端添加的 R2、D1 绑定全部被忽略或失效。保持当前项目的 `wrangler.toml` 结构即可。

### Q2: 访问 `/lvtuang` 后台登录提示“登录失败”或一直转圈？
* 检查是否在“设置 → 变量和机密”中添加了 `ADMIN_PASSWORD`。
* 检查添加变量后是否执行了**重新部署**。

### Q3: 软件发版或热更控制台提示“R2 存储桶未配置”？
* 检查 R2 绑定名称是否精确为 `SOFTWARE_BUCKET`（包含下划线，全大写）。
* 检查是否已将生产桶 `dy-ldms-downloads` 正确关联。

### Q4: 提示无法读取文章或素材库？
* 检查 D1 绑定名称是否精确为 `DB`。
* 检查是否已在 D1 数据库控制台中完整执行了 `schema.sql`。

---

*文档版本：v2.0*  
*适用项目：天才猫软件中心 / NSY Cloudflare Pages 架构*
