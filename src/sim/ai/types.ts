import type { FighterState, Vec2 } from "../types";

/**
 * AI 定義のメタデータ
 * - ラベルはデバッグUI表示用（日本語 + 英語）
 */
export const AI_DEFINITIONS = {
  nearest: { label: "最短距離優先 (nearest)" },
  aggressive: { label: "突撃型 (aggressive)" },
  defensive: { label: "距離保持型 (defensive)" },
} as const;

export type AIType = keyof typeof AI_DEFINITIONS;

/** 登録済み AI タイプ一覧 */
export const AI_TYPES = Object.keys(AI_DEFINITIONS) as Array<AIType>;

/** UI などで利用するセレクト表示用データ */
export const AI_OPTIONS = Object.entries(AI_DEFINITIONS).map(
  ([type, meta]) => ({ type: type as AIType, label: meta.label })
) as ReadonlyArray<{ type: AIType; label: string }>;

/**
 * AI の決定結果
 */
export type AIDecision = {
  /** 攻撃対象のファイターID (null の場合は攻撃しない) */
  targetId: string | null;
  /** 移動方向ベクトル (null の場合は移動しない) */
  moveDirection: Vec2 | null;
};

/**
 * ファイター AI インターフェース
 * 各 AI 実装はこのインターフェースを満たす必要がある
 */
export interface FighterAI {
  /**
   * ファイターの次の行動を決定する
   * @param self 行動するファイター
   * @param enemies 生存している敵ファイターのリスト
   * @param arenaRadius アリーナの半径
   * @returns AI の決定結果
   */
  decide(
    self: FighterState,
    enemies: FighterState[],
    arenaRadius: number
  ): AIDecision;
}

/**
 * ランタイム値が AIType かどうかを判定
 */
export function isAIType(value: unknown): value is AIType {
  return typeof value === "string" && value in AI_DEFINITIONS;
}
