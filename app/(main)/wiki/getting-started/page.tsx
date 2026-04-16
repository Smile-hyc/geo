import Link from "next/link";

export const metadata = {
  title: "入门 | Wiki",
  description: "新人入门路线",
};

export default function GettingStartedPage() {
  return (
    <>
      <h1>入门</h1>
      <p>新人入门路线与必读内容概览。</p>
      <ul>
        <li>
          <Link href="/wiki/getting-started/lab-intro">实验室介绍</Link>
        </li>
        <li>
          <Link href="/wiki/getting-started/environment-setup">环境配置</Link>
        </li>
        <li>
          <Link href="/wiki/getting-started/reading-list">阅读清单</Link>
        </li>
        <li>
          <Link href="/wiki/getting-started/research-workflow">科研流程</Link>
        </li>
      </ul>
    </>
  );
}
