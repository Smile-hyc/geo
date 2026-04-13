import { PrismaClient } from '@prisma/client';

// 实例化数据库遥控器
const prisma = new PrismaClient();

/**
 * 任务1：创建对战 (create-battle)
 * @param userId 当前玩家的 ID
 * @param modeType 游戏模式 (如 "standard")
 */
export async function createBattle(userId: number, modeType: string) {
  // 1. 获取题目：从图库里拿出所有图片
  const allImages = await prisma.imageAsset.findMany({
    select: { id: true, lat: true, lng: true } // 只拿我们需要的 id 和经纬度
  });

  // 如果图库里连5张图都没有，游戏没法玩，直接报错
  if (allImages.length < 5) {
    throw new Error("图库图片不足 5 张，无法生成对战！");
  }

  // 像洗牌一样把图片打乱顺序，然后拿前 5 张
  const shuffledImages = allImages.sort(() => 0.5 - Math.random());
  const selectedImages = shuffledImages.slice(0, 5);

  // 2. 创建对战房间 (Session) 和 5个回合 (Rounds)
  // Prisma 支持“嵌套写入”，开房间的同时把 5 道题直接塞进去
  const session = await prisma.battleSession.create({
    data: {
      user_id: userId,
      mode_type: modeType,
      ai_model_id: "mock-v1", // 队长任务：保留 ai_model_id，目前用 mock 假数据
      round_count: 5,
      // 批量创建 5 个回合
      rounds: {
        create: selectedImages.map((img, index) => {
          return {
            round_index: index + 1, // 第1轮，第2轮...
            image_id: img.id,
            truth_lat: img.lat,     // 队长任务：写入 ground truth 快照（存下当时的正确答案）
            truth_lng: img.lng      // 队长任务：写入 ground truth 快照
          };
        })
      }
    },
    // include 的意思是：建好房间后，把里面的 5 个回合也查出来一起返回给我
    include: {
      rounds: true
    }
  });

  // 完工！返回建好的对战信息
  return session;
}


// --- 下面是任务 2 的代码 ---

// 小工具 1：计算两个经纬度之间相差多少公里 (半正矢公式)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // 地球半径，单位公里
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 小工具 2：根据距离计算得分 (满分 5000 分)
function calculateScore(distanceKm: number) {
  // 如果偏离超过 2000 公里，直接 0 分
  if (distanceKm > 2000) return 0;
  // 线性衰减：距离越近，分数越接近 5000
  return Math.floor(5000 * (1 - distanceKm / 2000));
}

/**
 * 任务2：玩家交卷 (submit-battle-round)
 */
export async function submitBattleRound(
  userId: number,
  sessionId: number,
  roundIndex: number,
  userLat: number,
  userLng: number,
  elapsedMs: number
) {
  // 1. 查出这个房间和所有的回合记录
  const session = await prisma.battleSession.findUnique({
    where: { id: sessionId },
    include: { rounds: true }
  });

  // 2. 队长要求：校验 session 属于当前用户
  if (!session) throw new Error("找不到这个对战房间！");
  if (session.user_id !== userId) throw new Error("作弊警告：你不是这个房间的玩家！");

  // 3. 找到当前正在答的这一轮
  const round = session.rounds.find(r => r.round_index === roundIndex);
  if (!round) throw new Error("找不到这一轮题目！");

  // 4. 队长要求：校验当前 round 未提交（防重复提交）
  if (round.completed) throw new Error("这一轮已经交过卷了，不能重复提交！");
  // 必须要有 truth 才能算分
  if (round.truth_lat === null || round.truth_lng === null) throw new Error("这道题缺少正确答案数据！");

  // 5. 生成 AI 的猜测 (队长要求：目前 AI 走 mock 假数据)
  // 我们给正确答案加上一点随机偏差，假装是 AI 猜的
  const aiLat = round.truth_lat + (Math.random() - 0.5) * 10;
  const aiLng = round.truth_lng + (Math.random() - 0.5) * 10;

  // 6. 队长要求：计算 user/ai distance (玩家和AI离正确答案的距离)
  const userDistance = getDistanceKm(userLat, userLng, round.truth_lat, round.truth_lng);
  const aiDistance = getDistanceKm(aiLat, aiLng, round.truth_lat, round.truth_lng);

  // 7. 队长要求：计算 user/ai score (分数)
  const userScore = calculateScore(userDistance);
  const aiScore = calculateScore(aiDistance);

  // 8. 决定谁赢了
  let winnerType = "draw"; // 默认平局
  if (userScore > aiScore) winnerType = "user";
  else if (aiScore > userScore) winnerType = "ai";

  // 9. 队长要求：事务更新 round 和 session (要么全成功，要么全报错)
  const result = await prisma.$transaction(async (tx) => {

    // 操作A：把这一轮的成绩写进记录表，并标记 completed = true 防重复
    const updatedRound = await tx.battleRound.update({
      where: { id: round.id },
      data: {
        user_guess_lat: userLat,
        user_guess_lng: userLng,
        ai_guess_lat: aiLat,
        ai_guess_lng: aiLng,
        user_score: userScore,
        ai_score: aiScore,
        completed: true,              // 标记已完成
        round_winner_type: winnerType,// 存谁赢了
        elapsed_ms: elapsedMs         // 存花了多少时间
      }
    });

    // 操作B：把刚才这局的分数，加到房间的“总分”上
    const updatedSession = await tx.battleSession.update({
      where: { id: sessionId },
      data: {
        user_total_score: { increment: userScore }, // increment 意思是“在原来的基础上加上”
        ai_total_score: { increment: aiScore }
      }
    });

    return { updatedRound, updatedSession };
  });

  return result;
}


/**
 * 任务 3：奖品兑换 (redeem-prize)
 */
export async function redeemPrize(userId: number, prizeId: number) {
  // 1. 先查奖品，拿到兑换所需积分
  const prize = await prisma.prize.findUnique({
    where: { id: prizeId },
    select: {
      id: true,
      points_cost: true,
    }
  });

  if (!prize) {
    throw new Error("奖品不存在");
  }

  // 2. 创建兑换记录
  const redemption = await prisma.prizeRedemption.create({
    data: {
      user_id: userId,
      prize_id: prizeId,
      points_spent: prize.points_cost,
      status: "pending"
    }
  });

  return redemption;
}