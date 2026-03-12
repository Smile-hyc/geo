"use client";

import { User, Bot } from "lucide-react";

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
    <div className="flex items-center gap-4 bg-accent/30 rounded-xl px-4 py-3">
      <div className={`flex flex-col items-center min-w-16 ${userLeading ? "text-green-400" : ""}`}>
        <User className="h-5 w-5 mb-1" />
        <span className="text-xs text-muted-foreground">你</span>
        <span className={`text-2xl font-bold ${userLeading ? "text-green-400" : ""}`}>
          {userScore}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="text-xs text-muted-foreground mb-1">
          第 {currentRound} / {totalRounds} 轮
        </div>
        <div className="text-lg font-semibold text-muted-foreground">VS</div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1">
          {userScore + aiScore > 0 && (
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(userScore / (userScore + aiScore)) * 100}%` }}
            />
          )}
        </div>
      </div>

      <div className={`flex flex-col items-center min-w-16 ${aiLeading ? "text-red-400" : ""}`}>
        <Bot className="h-5 w-5 mb-1" />
        <span className="text-xs text-muted-foreground">AI</span>
        <span className={`text-2xl font-bold ${aiLeading ? "text-red-400" : ""}`}>
          {aiScore}
        </span>
      </div>
    </div>
  );
}
