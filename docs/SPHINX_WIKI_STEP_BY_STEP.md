# Sphinx Wiki 傻瓜式逐步教程

按顺序完成下面每一步，复制粘贴即可。**每一步做完再做下一步。**

---

## 第一步：确认已安装 Python

1. 按 `Win + R`（Windows）或打开“终端”（Mac），输入：

   **Windows（CMD 或 PowerShell）：**
   ```text
   python --version
   ```
   **Mac / Linux：**
   ```bash
   python3 --version
   ```

2. 若显示 `Python 3.8` 或更高（如 `3.10`、`3.11`），说明已安装，进入第二步。  
3. 若提示“不是内部或外部命令”或“command not found”，请先安装 Python：  
   - Windows：到 [python.org](https://www.python.org/downloads/) 下载安装包，安装时**勾选 “Add Python to PATH”**。  
   - Mac：在终端执行 `xcode-select --install` 或用 Homebrew：`brew install python`。

---

## 第二步：打开项目根目录

1. 打开 Cursor（或 VS Code），菜单 **文件 → 打开文件夹**。  
2. 选择你的 **geoannotate** 项目所在文件夹（即包含 `package.json`、`app` 文件夹的那一层），点“选择文件夹”。  
3. 确认左侧能看到 `app`、`docs`、`package.json` 等。

---

## 第三步：新建 wiki-sphinx 文件夹

1. 在左侧资源管理器中，在**项目根目录**上右键 → **新建文件夹**。  
2. 文件夹名输入：`wiki-sphinx`，回车。  
3. 确认出现 `wiki-sphinx` 文件夹（和 `app`、`docs` 同级）。

---

## 第四步：在终端里进入 wiki-sphinx 并创建虚拟环境

1. 菜单 **终端 → 新建终端**（或按 `` Ctrl+` ``）。  
2. 在终端里**逐行**执行下面命令（每行回车一次）。  
   **提示**：若终端已是 PowerShell（提示符前有 `PS`），直接从 `cd wiki-sphinx` 开始即可，不要输入 `powershell`。

   **Windows（PowerShell）：**
   ```powershell
   cd wiki-sphinx
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   （用 `venv` 而不是 `.venv`，避免以点开头的文件夹在资源管理器中不可见。）  
   若执行 `Activate.ps1` 报错“无法加载，因为在此系统上禁止运行脚本”，先执行：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   再重新执行上面的 `Activate.ps1` 那一行。

   **Mac / Linux：**
   ```bash
   cd wiki-sphinx
   python3 -m venv venv
   source venv/bin/activate
   ```

3. 执行完后，终端最前面应出现 `(venv)`，表示虚拟环境已激活。**不要关终端，后面步骤都在这个终端里做。**

   **若左侧看不到 `venv` 文件夹**：编辑器可能默认隐藏了 `venv`。在终端执行 `dir`（Windows）或 `ls`（Mac）确认是否有 `venv`；若有，说明已创建成功，直接执行 `.\venv\Scripts\Activate.ps1` 即可。本项目已在 `.vscode/settings.json` 中取消隐藏，若仍看不到可尝试刷新侧边栏或重启 Cursor。

   **若报错“无法将……Activate.ps1 项识别为……”**：说明虚拟环境可能没建在当前目录。请先执行 `cd wiki-sphinx` 和 `pwd` 确认路径，再执行 `python -m venv venv`（用 `venv` 文件夹名，左侧能看到该文件夹）。然后执行 `.\venv\Scripts\Activate.ps1`。若提示没有 python，改用 `py -m venv venv`。若实在无法激活，可跳过虚拟环境，在 wiki-sphinx 目录下直接执行 `pip install sphinx sphinx-rtd-theme myst-parser`，然后从第六步继续。

---

## 第五步：安装 Sphinx 和主题

在**同一个终端**（当前目录应为 `wiki-sphinx`，且已激活 `venv`）里执行：

```bash
pip install sphinx sphinx-rtd-theme myst-parser
```

等待安装结束，没有报错即可进入下一步。

---

## 第六步：用 Sphinx 初始化项目

仍在 **wiki-sphinx** 目录下执行：

```bash
sphinx-quickstart --sep -q -p "Wiki" -a "实验室" -v "1.0" .
```

执行完后，在左侧资源管理器中展开 `wiki-sphinx`，应能看到：
- `source` 文件夹  
- `Makefile`（Mac/Linux）或 `make.bat`（Windows）  
- `source/conf.py`、`source/index.rst`  

若没有 `source`，检查当前目录是否为 `wiki-sphinx`（可再执行一次 `cd wiki-sphinx` 后重试）。

---

## 第七步：创建 _static 文件夹（避免警告）

在终端执行：

**Windows（PowerShell）：**
```powershell
New-Item -ItemType Directory -Force -Path source\_static
```

**Mac / Linux：**
```bash
mkdir -p source/_static
```

---

## 第八步：修改 conf.py

1. 在左侧点击打开 **wiki-sphinx/source/conf.py**。  
2. 找到以 `project = ` 开头的那几行（约在文件上方），把那一块**整体替换**成下面这一段（从 `project` 到 `html_static_path`  inclusive，保留文件其余部分不动；若找不到对应项，就按位置插入）：

```python
project = 'Wiki'
copyright = '2025, 实验室'   # 年份可改为当前年份，如 2026
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

3. 若原文件里已有同名的 `project`、`extensions`、`html_theme` 等，只改这些变量的值，使最终和上面一致即可。  
4. **保存文件**（Ctrl+S）。

---

## 第九步：替换首页 index.rst

1. 打开 **wiki-sphinx/source/index.rst**。  
2. **全选**（Ctrl+A），**删除**，然后**粘贴**下面全部内容：

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

3. **保存**（Ctrl+S）。

---

## 第十步：创建 getting-started 文件夹和入门索引

1. 在 **source** 上右键 → **新建文件夹**，名称：`getting-started`。  
2. 在 **source/getting-started** 里右键 → **新建文件**，文件名：`index.rst`。  
3. 打开 **source/getting-started/index.rst**，粘贴：

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

4. 保存。

---

## 第十一步：创建入门下的 4 个 Markdown 文件

在 **source/getting-started** 下新建 4 个文件，每个文件名和内容如下（**文件名必须一致**）。

**文件 1：lab-intro.md**

```markdown
# 实验室介绍

本节介绍实验室概况与主要科研方向。内容由管理员后续填充。

## 研究方向

（待补充）

## 团队与资源

（待补充）
```

**文件 2：environment-setup.md**

```markdown
# 环境配置

本节说明开发环境、依赖安装与常用配置。内容由管理员后续填充。

## 依赖与安装

（待补充）

## 环境变量与配置

（待补充）
```

**文件 3：reading-list.md**

```markdown
# 阅读清单

本节提供新人论文阅读路径与常用论文、工具推荐。内容由管理员后续填充。

## 必读论文

（待补充）

## 扩展阅读

（待补充）
```

**文件 4：research-workflow.md**

```markdown
# 科研流程

本节介绍实验室常用的科研工作流程。内容由管理员后续填充。

## 选题与开题

（待补充）

## 实验与迭代

（待补充）
```

每个文件创建后都**保存**。

---

## 第十二步：在 source 下创建 5 个单页 Markdown

在 **source** 文件夹下（和 index.rst 同级）新建下面 5 个文件，**不要**放在 getting-started 里。

**文件 1：datasets.md**

```markdown
# 数据集说明

本节介绍实验室常用数据集的获取方式、格式说明与使用规范。内容由管理员后续填充。

## 可用数据集

（待补充）

## 数据格式与标注规范

（待补充）
```

**文件 2：tools.md**

```markdown
# 常用工具

本节汇总实验室常用开发与实验工具。内容由管理员后续填充。

## 开发与运行环境

（待补充）

## 实验与评测工具

（待补充）
```

**文件 3：experiments.md**

```markdown
# 实验规范

本节说明实验记录、复现与训练评测流程规范。内容由管理员后续填充。

## 实验记录与复现

（待补充）

## 训练与评测流程

（待补充）
```

**文件 4：faq.md**

```markdown
# 常见问题

本节整理新人常见问题与解答。内容由管理员后续填充。

## 环境与权限

（待补充）

## 实验与提交

（待补充）
```

**文件 5：glossary.md**

```markdown
# 术语表

本节汇总文档中常用术语与缩写。内容由管理员后续填充。

## 核心术语

（待补充）

## 缩写

（待补充）
```

每个文件创建后都**保存**。

---

## 第十三步：本地构建（生成网页）

在终端中确认：
- 当前目录是 **wiki-sphinx**（若不在，执行 `cd wiki-sphinx`）；  
- 虚拟环境已激活（前面有 `(.venv)`）。

然后执行：

**Windows：**
```powershell
sphinx-build -b html source build/html
```

**Mac / Linux：**
```bash
make html
```
（若没有 `make`，也可用：`sphinx-build -b html source build/html`）

若没有报错，会多出一个 **build** 或 **_build** 文件夹，里面有个 **html** 文件夹。

---

## 第十四步：在浏览器中预览

1. 在左侧资源管理器中找到 **wiki-sphinx** 下的 **build/html**（或 **_build/html**）。  
2. 右键 **index.html** → **在文件资源管理器中显示**（或“Reveal in File Explorer”），然后双击 **index.html** 用浏览器打开。  
   或直接在地址栏输入该文件的完整路径，例如：  
   `D:\HuaweiMoveData\Users\17669\Desktop\geoannotate\wiki-sphinx\build\html\index.html`  
3. 应能看到带左侧目录的 Wiki 页面，点击左侧链接可切换不同页面。  
4. 若打不开，检查第十三步是否执行成功、是否有 `build/html/index.html`（或 `_build/html/index.html`）。

---

## 第十五步：部署（三选一）

任选一种方式即可。

### 方式 A：复制到主站 public/wiki（主站域名/wiki 访问）

1. 在 **geoannotate** 项目下找到 **public** 文件夹；若没有，在项目根目录新建一个 **public**。  
2. 在 **public** 下新建文件夹 **wiki**。  
3. 把 **wiki-sphinx/build/html**（或 **_build/html**）**里面的所有文件和文件夹**（不要复制“html”这个文件夹本身）复制到 **public/wiki** 里。  
4. 重新部署或启动主站（如 `npm run build` 再 `npm run start`，或推送到 Vercel 等）。  
5. 在浏览器访问：`https://你的主站域名/wiki/` 或 `http://localhost:3000/wiki/`，应能看到 Wiki。

### 方式 B：托管到 Read the Docs（独立网址）

1. 把整个 **geoannotate** 项目（或至少 **wiki-sphinx** 文件夹）推送到 **GitHub**。  
2. 打开 [readthedocs.org](https://readthedocs.org/)，注册/登录。  
3. 点击 **Import a Project**，选择你的 GitHub 仓库。  
4. 若 Wiki 在子目录 **wiki-sphinx**：在项目设置里找到 **Config file**，填：`wiki-sphinx/source/conf.py`。  
5. 保存后触发一次 **Build**，完成后会给你一个类似 `https://你的项目名.readthedocs.io` 的地址，即独立 Wiki 站。

### 方式 C：上传到自己的服务器

1. 用 FTP/SFTP 等工具，把 **build/html**（或 **_build/html**）**里面的全部内容**上传到服务器某个目录（如 `/var/www/wiki/`）。  
2. 在 Nginx 里为该目录配置站点或 `location /wiki { ... }`（具体写法见 `docs/SPHINX_WIKI_TUTORIAL.md` 第六节）。  
3. 用你配置的域名或路径访问即可。

---

## 常见问题

**Q：执行 sphinx-build 或 make html 报错 “No module named 'sphinx'”**  
A：虚拟环境未激活或不在 wiki-sphinx 目录。先执行 `cd wiki-sphinx`，再执行激活命令（第四步），然后再执行构建。

**Q：左侧目录是空的或报错**  
A：检查 toctree 里的文件名是否和实际一致：`getting-started/index`、`datasets`、`tools`、`experiments`、`faq`、`glossary`，且这些文件都在 **source** 下（getting-started 在 source/getting-started 下）。

**Q：修改 .md 后网页没变**  
A：每次改完内容后，需要重新执行一次第十三步（`sphinx-build` 或 `make html`），再刷新浏览器。

**Q：Windows 没有 make 命令**  
A：一直用 `sphinx-build -b html source build/html` 即可，效果和 `make html` 一样。

---

按顺序做完以上步骤，即可完成 Sphinx + Read the Docs 主题的傻瓜式搭建与部署。之后只需编辑 **source** 下的 `.md` 或 `.rst` 文件，再执行一次第十三步构建，即可更新 Wiki 内容。
