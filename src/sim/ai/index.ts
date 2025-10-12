import type { FighterAI, AIType } from "./types";
import { NearestTargetAI } from "./nearestTarget";
import { AggressiveAI } from "./aggressive";
import { DefensiveAI } from "./defensive";

export type { FighterAI, AIDecision, AIType } from "./types";
export { NearestTargetAI } from "./nearestTarget";
export { AggressiveAI } from "./aggressive";
export { DefensiveAI } from "./defensive";

/**
 * AI インスタンスのキャッシュ（シングルトンパターン）
 */
const aiCache = new Map<AIType, FighterAI>();

/**
 * AI タイプから AI インスタンスを取得
 * @param type AI の種類
 * @returns AI インスタンス
 */
export function getAI(type: AIType): FighterAI {
  // キャッシュから取得（存在しない場合は新規作成）
  if (!aiCache.has(type)) {
    switch (type) {
      case "nearest":
        aiCache.set(type, new NearestTargetAI());
        break;
      case "aggressive":
        aiCache.set(type, new AggressiveAI());
        break;
      case "defensive":
        aiCache.set(type, new DefensiveAI());
        break;
    }
  }
  return aiCache.get(type)!;
}
