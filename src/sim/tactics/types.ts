import type { FighterState, Vec2 } from "../types";

/**
 * 戦術定義のメタデータ
 * - ラベルはデバッグUI表示用（日本語 + 英語）
 */
export const TACTIC_DEFINITIONS = {
  nearest: { label: "最短距離優先 (nearest)" },
  aggressive: { label: "突撃型 (aggressive)" },
  defensive: { label: "距離保持型 (defensive)" },
} as const;

export type TacticId = keyof typeof TACTIC_DEFINITIONS;

/** 登録済み戦術 ID 一覧 */
export const TACTIC_IDS = Object.keys(TACTIC_DEFINITIONS) as Array<TacticId>;

/** UI などで利用するセレクト表示用データ */
export const TACTIC_OPTIONS = Object.entries(TACTIC_DEFINITIONS).map(
  ([id, meta]) => ({ id: id as TacticId, label: meta.label })
) as ReadonlyArray<{ id: TacticId; label: string }>;

/**
 * 戦術の決定結果
 */
export type TacticDecision = {
  /** 攻撃対象のファイターID (null の場合は攻撃しない) */
  targetId: string | null;
  /** 移動方向ベクトル (null の場合は移動しない) */
  moveDirection: Vec2 | null;
};

/**
 * ファイター戦術インターフェース
 * 各戦術実装はこのインターフェースを満たす必要がある
 */
export interface FighterTactic {
  /**
   * ファイターの次の行動を決定する
   * @param self 行動するファイター
   * @param enemies 生存している敵ファイターのリスト
   * @param arenaRadius アリーナの半径
   * @returns 戦術の決定結果
   */
  decide(
    self: FighterState,
    enemies: FighterState[],
    arenaRadius: number
  ): TacticDecision;
}

/**
 * ランタイム値が TacticId かどうかを判定
 */
export function isTacticId(value: unknown): value is TacticId {
  return typeof value === "string" && value in TACTIC_DEFINITIONS;
}
