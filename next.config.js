/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 👉 第1处修改：告诉 Next.js 导出纯静态网页
  images: {
    unoptimized: true, // 👉 第2处修改：静态部署必须加这一行，关闭默认的图片优化服务器
    remotePatterns:[
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;