import type { FighterState, Vec2 } from "../types";

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
 * AI の種類を表す文字列リテラル型
 */
export type AIType = "nearest" | "aggressive" | "defensive";
