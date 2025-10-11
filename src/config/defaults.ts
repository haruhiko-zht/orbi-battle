import type { BattleConfig } from "../sim/types";

/**
 * デフォルトのバトル設定
 * - 初回起動時に使用される
 * - デバッグパネルの初期値にもなる
 */
export const defaults: BattleConfig = {
  seed: 123456,
  arenaRadius: 220,
  tickRate: 60,
  fighterA: {
    hpMax: 120,
    atk: 10,
    range: 36,
    speed: 75,
    cooldown: 0.45,
  },
  fighterB: {
    hpMax: 120,
    atk: 10,
    range: 36,
    speed: 75,
    cooldown: 0.45,
  },
};
