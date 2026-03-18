# Sphinx + Read the Docs 独立静态部署教程

> **新手推荐**：若希望按步骤无脑操作，请直接看 **[Sphinx Wiki 傻瓜式逐步教程](./SPHINX_WIKI_STEP_BY_STEP.md)**。  
> 本文档侧重配置说明与部署方式，可与傻瓜式教程配合使用。

本教程说明如何用 **Sphinx** 与 **Read the Docs 主题** 将 Wiki 构建为独立静态站点，并可挂到主站 `/wiki` 或单独域名。

---

## 一、前置要求

- **Python 3.8+**（建议 3.10+）
- **pip** 或 **venv**

检查版本：

```bash
python --version
pip --version
```

---

## 二、创建 Sphinx 文档项目

可选两种方式：**放在本仓库内**（如 `wiki-sphinx/`）或 **单独仓库**。以下以本仓库内 `wiki-sphinx/` 为例。

### 2.1 创建目录并进入

```bash
cd /path/to/geoannotate
mkdir wiki-sphinx
cd wiki-sphinx
```

### 2.2 创建虚拟环境（推荐）

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate
```

### 2.3 安装 Sphinx、主题与 Markdown 支持

```bash
pip install sphinx sphinx-rtd-theme myst-parser
```

- `sphinx`：文档构建引擎  
- `sphinx-rtd-theme`：Read the Docs 风格主题  
- `myst-parser`：支持用 Markdown 写内容（与 wiki.docx 推荐的 “Markdown + MyST” 一致）

### 2.4 快速初始化 Sphinx 项目

```bash
sphinx-quickstart --sep -q -p "Wiki" -a "实验室" -v "1.0" .
```

- `--sep`：源文件放在 `source/` 目录  
- `-q`：安静模式，少交互  
- 会生成 `source/conf.py`、`source/index.rst`、`Makefile`、`make.bat` 等

若提示是否分离 source 与 build，选 `y`（已由 `--sep` 指定）。

---

## 三、配置 Sphinx（conf.py）

用编辑器打开 `source/conf.py`，按下面修改或替换关键部分。

### 3.1 基础与扩展

在文件靠前位置找到并修改：

```python
# 项目信息（按需修改）
project = 'Wiki'
copyright = '2025, 实验室'
author = '实验室'
release = '1.0'

# 扩展
extensions = [
    'myst_parser',   # 支持 .md 源文件
]

# 源文件后缀
source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}
```

### 3.2 使用 Read the Docs 主题

在 `conf.py` 中增加或修改：

```python
html_theme = 'sphinx_rtd_theme'
html_theme_options = {
    'navigation_depth': 3,
    'collapse_navigation': False,
    'titles_only': False,
}
```

### 3.3 中文与路径

```python
language = 'zh_CN'
html_static_path = ['_static']  # 若有自定义 CSS/JS，放 source/_static
```

### 3.4 完整 conf.py 参考（仅关键片段）

若你从零写，可参考以下完整结构（只保留与本节相关的即可）：

```python
# source/conf.py 关键内容汇总
project = 'Wiki'
copyright = '2025, 实验室'
author = '实验室'
release = '1.0'

extensions = ['myst_parser']
source_suffix = {'.rst': 'restructuredtext', '.md': 'markdown'}
source_encoding = 'utf-8'

templates_path = ['_templates']
exclude_patterns = []
language = 'zh_CN'

html_theme = 'sphinx_rtd_theme'
html_theme_options = {
    'navigation_depth': 3,
    'collapse_navigation': False,
    'titles_only': False,
}
html_static_path = ['_static']
```

保存后，若目录里还没有 `source/_static`，可创建空目录避免警告：

```bash
mkdir -p source/_static
```

---

## 四、目录与文档结构（与现有 Wiki 对应）

在 `source/` 下建立与“入门 / 数据集 / 工具 / 实验规范 / FAQ / 术语表”对应的文件，便于后续挂到主站或独立访问。

### 4.1 推荐目录结构

```text
wiki-sphinx/
├── Makefile
├── make.bat
├── source/
│   ├── conf.py
│   ├── index.rst          # 首页，内含 toctree 导航
│   ├── getting-started/
│   │   ├── index.rst      # 入门索引
│   │   ├── lab-intro.md
│   │   ├── environment-setup.md
│   │   ├── reading-list.md
│   │   └── research-workflow.md
│   ├── datasets.md
│   ├── tools.md
│   ├── experiments.md
│   ├── faq.md
│   └── glossary.md
└── build/                 # 构建输出，可忽略或加入 .gitignore
```

### 4.2 首页 index.rst（含 toctree）

编辑 `source/index.rst`，内容示例：

```rst
Wiki 文档
========

服务于新加入实验室的同学，用于快速了解实验室科研方向、常用工具、论文阅读路径、实验规范、数据集、训练评测流程等内容。

.. toctree::
   :maxdepth: 2
   :caption: 目录

   getting-started/index
   datasets
   tools
   experiments
   faq
   glossary
```

### 4.3 入门子目录

创建 `source/getting-started/index.rst`：

```rst
入门
====

.. toctree::
   :maxdepth: 1

   lab-intro
   environment-setup
   reading-list
   research-workflow
```

在 `source/getting-started/` 下新建四个 Markdown 文件，内容可先写占位：

**lab-intro.md**

```markdown
# 实验室介绍

本节介绍实验室概况与主要科研方向。内容由管理员后续填充。

## 研究方向

（待补充）

## 团队与资源

（待补充）
```

**environment-setup.md**、**reading-list.md**、**research-workflow.md** 可类似写标题 + “（待补充）”。

### 4.4 其他单页

在 `source/` 下创建：

- **datasets.md**：`# 数据集说明` + 简短说明  
- **tools.md**：`# 常用工具`  
- **experiments.md**：`# 实验规范`  
- **faq.md**：`# 常见问题`  
- **glossary.md**：`# 术语表`  

内容可先占位，后续由管理员填充。

---

## 五、本地构建

在 `wiki-sphinx/` 目录下执行：

```bash
# Linux / macOS
make html

# Windows（若未装 make）
sphinx-build -b html source build/html
```

构建产物在 **`build/html/`** 或 **`_build/html/`**（取决于 Makefile 中的 `BUILDDIR`，以本地实际为准）。用浏览器打开其中的 `index.html` 即可预览。

---

## 六、部署方式

### 方式 A：托管在 Read the Docs 网站（独立域名）

1. 注册 [Read the Docs](https://readthedocs.org/)。
2. 将文档代码放到 **GitHub/GitLab**（可新建仓库如 `geoannotate-wiki`，或使用本仓库并指定子目录 `wiki-sphinx`，若 RTD 支持）。
3. 在 Read the Docs 中 “Import a Project”，连到该仓库。
4. 若项目在子目录，在 “Advanced Settings” 中设置 **Documentation type: Sphinx**，并填写 **Config file** 为 `wiki-sphinx/source/conf.py`（或实际路径）。
5. 构建成功后，会得到 `https://xxx.readthedocs.io` 形式地址，可作为“独立域名”的 Wiki。

适合：希望零运维、自动构建、带搜索的独立文档站。

### 方式 B：自托管静态文件（同域名 /wiki 或独立域名）

1. **构建**：在 `wiki-sphinx/` 下执行 `make html`（或 `sphinx-build ...`），得到 `build/html/`。
2. **上传**：将 `build/html/` 内**全部内容**上传到：
   - 对象存储（腾讯云 COS、阿里 OSS 等）配置为静态网站，或  
   - 服务器某目录，如 `/var/www/wiki/`。
3. **Nginx 配置示例**  
   - 挂到主站同域名下的 `/wiki`：

     ```nginx
     location /wiki {
         alias /var/www/wiki/;   # 或你上传的目录
         index index.html;
         try_files $uri $uri/ /wiki/index.html;
     }
     ```

   - 或独立子域（如 `wiki.example.com`）：

     ```nginx
     server {
         server_name wiki.example.com;
         root /var/www/wiki;
         index index.html;
         location / {
             try_files $uri $uri/ /index.html;
         }
     }
     ```

4. 若使用对象存储，需在控制台开启“静态网站”并设置默认首页为 `index.html`；若通过 CDN 或 Nginx 反代，同样保证根请求返回 `index.html`。

这样即可实现“独立静态部署”，并自由选择同域名 `/wiki` 或独立域名。

### 方式 C：构建产物复制到主站仓库（主站负责挂 /wiki）

1. 在 `wiki-sphinx/` 下执行 `make html`。
2. 将 `build/html/` 内容复制到主站项目的 **`public/wiki/`**（若主站为 Next.js，则访问 `https://主站域名/wiki/` 会命中 `public/wiki/index.html`）。
3. 主站部署时一起发布；更新 Wiki 时重新构建并覆盖 `public/wiki/` 再部署主站。

适合：希望始终用“主站域名/wiki”且主站由你完全控制的情况。

---

## 七、可选：GitHub Actions 自动构建

若文档放在 GitHub 且希望“推送后自动构建并部署”，可使用 CI。示例：构建后上传到服务器或对象存储（需在仓库 Secrets 中配置 FTP/SSH/OSS 等凭据）。

**示例：仅构建并上传到 GitHub Pages（独立域名示例）**

在仓库根目录创建 `.github/workflows/wiki-build.yml`（若 Wiki 在子目录 `wiki-sphinx`）：

```yaml
name: Build Wiki

on:
  push:
    branches: [main]
    paths:
      - 'wiki-sphinx/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd wiki-sphinx
          pip install sphinx sphinx-rtd-theme myst-parser

      - name: Build HTML
        run: |
          cd wiki-sphinx
          sphinx-build -b html source build/html

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: wiki-sphinx/build/html
```

若使用 GitHub Pages，还需在仓库 Settings → Pages 中选择 “GitHub Actions” 作为源。若改为上传到自有服务器或 OSS，可把最后一步换成对应 action 或脚本。

---

## 八、自检清单

- [ ] Python 3.8+、pip 已安装  
- [ ] `wiki-sphinx/` 下已安装 `sphinx`、`sphinx-rtd-theme`、`myst-parser`  
- [ ] `source/conf.py` 已配置主题为 `sphinx_rtd_theme`，并启用 `myst_parser`  
- [ ] `source/index.rst` 的 toctree 包含 getting-started、datasets、tools、experiments、faq、glossary  
- [ ] `make html`（或 `sphinx-build`）能成功，本地打开 `build/html/index.html` 正常  
- [ ] 部署后可通过你选择的地址（主站 `/wiki` 或独立域名）访问 Wiki  

完成以上即表示 Sphinx + Read the Docs 主题的独立静态部署已就绪；内容可在对应 `.md`/`.rst` 中持续补充。

---

## 九、与主站导航集成

采用本方案后，若希望用户从主站点击「Wiki」进入 Sphinx 文档站：

- **若 Wiki 挂主站同域名**（如 `https://主站/wiki`）：主站导航栏的 Wiki 链接保持指向 **`/wiki`** 即可。
- **若 Wiki 使用独立域名**（如 `https://wiki.readthedocs.io` 或自建子域）：将主站导航栏中「Wiki」的链接改为该独立地址（修改 `components/layout/Navbar.tsx` 里 `href="/wiki"` 为对应 URL）。
