# Wiki 部署说明

Wiki 是主站 Next.js 应用的一部分，**随主站一起部署，无需单独步骤**。

---

## 一、与主站一起部署（推荐）

- Wiki 路由位于 `app/(main)/wiki/`，访问路径为 **`/wiki`**。
- 主站怎么部署，Wiki 就怎么部署：
  - **Vercel**：推送代码后自动构建，访问 `https://你的域名/wiki`。
  - **CloudBase 静态网站托管**：在项目根目录执行 `npm run build`，将 `.next` 或构建产物部署到静态托管，或使用 Next.js 兼容的 Node 托管。
  - **自建服务器（Node）**：`npm run build` 后 `npm run start`，Nginx 反向代理到 Next 服务，`/wiki` 由同一服务提供。
  - **Docker / 其他**：与主站同一镜像、同一进程即可。

**结论**：部署主站后，直接访问 **`https://主站域名/wiki`** 即可使用 Wiki，无需额外配置。

---

## 二、发布到 `/wiki` 路径

- 若主站部署在根域名（如 `https://geoannotate.example.com`），Wiki 即为 `https://geoannotate.example.com/wiki`。
- 若希望通过 Nginx 将 `/wiki` 反代到静态资源（例如将来改用 Sphinx 生成静态 HTML）：
  1. 构建静态站点并输出到某目录（如 `public/wiki`）。
  2. 在 Nginx 中为 `/wiki` 配置 `alias` 或 `root` 指向该目录。

当前实现下**不需要**这一步：直接部署 Next 应用即可。

---

## 三、独立静态部署（可选）

若日后希望将 Wiki 单独构建为**纯静态 HTML**（如用 Sphinx + Read the Docs 主题），可：

1. 使用 Sphinx 单独建一个文档项目，构建出静态 HTML。
2. 将构建产物上传到对象存储或放到 Nginx 某目录。
3. 主站 Nginx 配置 `location /wiki { ... }` 指向该静态目录，或主站用重定向/iframe 挂载该静态站。

当前项目中的 Wiki 是 **Next.js 页面**，不是 Sphinx；若需“文档仓库更新后自动构建”，可配合 CI（如 GitHub Actions）在文档仓库中跑 Sphinx 构建并部署到上述静态托管。

---

## 四、自检

- [ ] 主站已能正常访问（如 `https://主站域名/home`）。
- [ ] 访问 `https://主站域名/wiki` 可打开 Wiki 首页。
- [ ] 顶部导航栏有「Wiki」入口，点击可进入 Wiki。

完成以上即表示 Wiki 已随主站正确部署。
