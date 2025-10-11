import type { BattleConfig, BattleState, FighterState } from "./types";

/**
 * バトルログ - バトル全体の記録
 * - 設定とすべてのフレームを含む
 * - サーバー送信、リプレイ、デバッグに利用
 */
export type BattleLog = {
  /** ログフォーマットのバージョン（将来の互換性のため） */
  version: 1;
  /** このバトルの設定 */
  config: BattleConfig;
  /** 全フレームの状態スナップショット（frames[0]が初期状態） */
  frames: BattleState[];
};

/**
 * BattleState の深いコピーを作成
 * - イミュータブルな操作のために使用
 */
export function cloneState(state: BattleState): BattleState {
  return {
    t: state.t,
    winner: state.winner,
    a: cloneFighter(state.a),
    b: cloneFighter(state.b),
  };
}

/**
 * FighterState の深いコピーを作成
 */
function cloneFighter(f: FighterState): FighterState {
  return {
    id: f.id,
    pos: { ...f.pos },
    hp: f.hp,
    cooldown: f.cooldown,
    alive: f.alive,
    params: { ...f.params },
  };
}

/**
 * BattleConfig の深いコピーを作成
 */
export function cloneConfig(cfg: BattleConfig): BattleConfig {
  return {
    seed: cfg.seed,
    arenaRadius: cfg.arenaRadius,
    tickRate: cfg.tickRate,
    fighterA: { ...cfg.fighterA },
    fighterB: { ...cfg.fighterB },
  };
}
