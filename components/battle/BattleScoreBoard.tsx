"use client";

import { Bot, User } from "lucide-react";

interface Props {
  userScore: number;
  aiScore: number;
  currentRound: number;
  totalRounds: number;
}

export default function BattleScoreBoard({
  userScore,
  aiScore,
  currentRound,
  totalRounds,
}: Props) {
  const userLeading = userScore > aiScore;
  const aiLeading = aiScore > userScore;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-accent/30 px-4 py-3">
      <div
        className={`flex min-w-16 flex-col items-center ${userLeading ? "text-green-400" : ""}`}
      >
        <User className="mb-1 h-5 w-5" />
        <span className="text-xs text-muted-foreground">我方</span>
        <span className={`text-2xl font-bold ${userLeading ? "text-green-400" : ""}`}>
          {userScore}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center">
        <div className="mb-1 text-xs text-muted-foreground">
          第 {currentRound} / {totalRounds} 轮
        </div>
        <div className="text-lg font-semibold text-muted-foreground">对战</div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
          {userScore + aiScore > 0 && (
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(userScore / (userScore + aiScore)) * 100}%` }}
            />
          )}
        </div>
      </div>

      <div className={`flex min-w-16 flex-col items-center ${aiLeading ? "text-red-400" : ""}`}>
        <Bot className="mb-1 h-5 w-5" />
        <span className="text-xs text-muted-foreground">AI</span>
        <span className={`text-2xl font-bold ${aiLeading ? "text-red-400" : ""}`}>
          {aiScore}
        </span>
      </div>
    </div>
  );
}
