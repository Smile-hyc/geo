import Link from "next/link";

export const metadata = {
  title: "Wiki 文档 | GeoAnnotate",
  description: "实验室新人科研入门：实验室介绍、环境配置、论文阅读、数据集与实验规范",
};

export default function WikiIndexPage() {
  return (
    <>
      <h1>Wiki 文档系统</h1>
      <p>
        Wiki 服务于新加入实验室的同学，用于快速了解实验室科研方向、常用工具、论文阅读路径、实验规范、数据集、训练评测流程等内容。
        <strong>内容由管理员后续填充即可。</strong>
      </p>

      <h2>功能定位</h2>
      <ul>
        <li>主要承载实验室新人科研入门内容；</li>
        <li>可独立部署为静态文档服务，也可通过主站 <code>/wiki</code> 路由集成。</li>
      </ul>
      <p>Wiki 不是主业务，但应稳定、易维护、可快速更新，承载以下内容：</p>
      <ul>
        <li>实验室介绍</li>
        <li>新人入门路线</li>
        <li>常用论文与工具</li>
        <li>数据集说明</li>
        <li>实验规范</li>
        <li>训练与评测流程</li>
        <li>常见问题</li>
      </ul>

      <h2>快速导航</h2>
      <ul>
        <li><Link href="/wiki/getting-started/lab-intro">实验室介绍</Link></li>
        <li><Link href="/wiki/getting-started/environment-setup">环境配置</Link></li>
        <li><Link href="/wiki/getting-started/reading-list">阅读清单</Link></li>
        <li><Link href="/wiki/getting-started/research-workflow">科研流程</Link></li>
        <li><Link href="/wiki/datasets">数据集</Link></li>
        <li><Link href="/wiki/tools">工具</Link></li>
        <li><Link href="/wiki/experiments">实验规范</Link></li>
        <li><Link href="/wiki/faq">常见问题</Link></li>
        <li><Link href="/wiki/glossary">术语表</Link></li>
      </ul>
    </>
  );
}
