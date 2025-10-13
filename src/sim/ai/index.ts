import { NearestTargetAI } from "./nearestTarget";
import { AggressiveAI } from "./aggressive";
import { DefensiveAI } from "./defensive";
import { AI_DEFINITIONS, type FighterAI, type AIType } from "./types";

export type { FighterAI, AIDecision, AIType } from "./types";
export { AI_DEFINITIONS, AI_TYPES, AI_OPTIONS } from "./types";
export { NearestTargetAI } from "./nearestTarget";
export { AggressiveAI } from "./aggressive";
export { DefensiveAI } from "./defensive";

const aiFactories: Record<AIType, () => FighterAI> = {
  nearest: () => new NearestTargetAI(),
  aggressive: () => new AggressiveAI(),
  defensive: () => new DefensiveAI(),
};

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
  if (!aiCache.has(type)) {
    const factory = aiFactories[type];
    if (!factory) {
      throw new Error(`未登録のAIタイプです: ${type}`);
    }
    aiCache.set(type, factory());
  }
  return aiCache.get(type)!;
}

/**
 * 登録済みAIのラベルを取得
 */
export function getAiLabel(type: AIType): string {
  return AI_DEFINITIONS[type]?.label ?? type;
}
