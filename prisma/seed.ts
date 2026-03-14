import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** 带坐标的测试图片（用于 AI 对战） */
const TEST_IMAGES = [
  { storage_url: "https://picsum.photos/seed/beijing/800/600", lat: 39.9042, lng: 116.4074, true_location: "北京天安门" },
  { storage_url: "https://picsum.photos/seed/shanghai/800/600", lat: 31.2304, lng: 121.4737, true_location: "上海外滩" },
  { storage_url: "https://picsum.photos/seed/guangzhou/800/600", lat: 23.1291, lng: 113.2644, true_location: "广州塔" },
  { storage_url: "https://picsum.photos/seed/shenzhen/800/600", lat: 22.5431, lng: 114.0579, true_location: "深圳市民中心" },
  { storage_url: "https://picsum.photos/seed/hangzhou/800/600", lat: 30.2741, lng: 120.1551, true_location: "杭州西湖" },
  { storage_url: "https://picsum.photos/seed/chengdu/800/600", lat: 30.5728, lng: 104.0668, true_location: "成都宽窄巷子" },
  { storage_url: "https://picsum.photos/seed/xian/800/600", lat: 34.3416, lng: 108.9398, true_location: "西安大雁塔" },
  { storage_url: "https://picsum.photos/seed/nanjing/800/600", lat: 32.0603, lng: 118.7969, true_location: "南京夫子庙" },
  { storage_url: "https://picsum.photos/seed/suzhou/800/600", lat: 31.2989, lng: 120.5853, true_location: "苏州园林" },
  { storage_url: "https://picsum.photos/seed/dali/800/600", lat: 25.6065, lng: 100.2676, true_location: "云南大理" },
];

async function main() {
  console.log("开始添加测试图片...");
  for (const img of TEST_IMAGES) {
    const existing = await prisma.imageAsset.findFirst({
      where: { storage_url: img.storage_url, true_location: img.true_location },
    });
    if (!existing) {
      await prisma.imageAsset.create({
        data: {
          storage_url: img.storage_url,
          lat: img.lat,
          lng: img.lng,
          true_location: img.true_location,
          mode_tags: ["general"],
          difficulty: 1,
        },
      });
      console.log(`  + ${img.true_location}`);
    }
  }
  const count = await prisma.imageAsset.count({ where: { lat: { not: null }, lng: { not: null } } });
  console.log(`完成！当前共有 ${count} 张带坐标的图片。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
