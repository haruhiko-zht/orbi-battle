import type { BattleConfig } from "../sim/types";

// NOTE: Phaser 側の HP レイアウトは teams[0] を味方（右列）、teams[1] を敵（左列）として扱う

/**
 * デフォルトのバトル設定（1 vs 1）
 * - 初回起動時に使用される
 * - デバッグパネルの初期値にもなる
 * - チーム順序は味方 -> 敵固定
 */
export const defaults: BattleConfig = {
  seed: 123456,
  arenaRadius: 220,
  tickRate: 60,
  teams: [
    {
      id: "A",
      fighters: [
        {
          hpMax: 120,
          atk: 10,
          range: 9,
          speed: 75,
          cooldown: 0.45,
        },
      ],
    },
    {
      id: "B",
      fighters: [
        {
          hpMax: 120,
          atk: 10,
          range: 9,
          speed: 75,
          cooldown: 0.45,
        },
      ],
    },
  ],
};

/**
 * 3 vs 3 のテスト用設定
 * - チーム順序は味方 -> 敵固定
 */
export const defaults3v3: BattleConfig = {
  seed: 123456,
  arenaRadius: 220,
  tickRate: 60,
  teams: [
    {
      id: "A",
      fighters: [
        { hpMax: 100, atk: 8, range: 9, speed: 75, cooldown: 0.5 },
        { hpMax: 120, atk: 10, range: 10, speed: 60, cooldown: 0.4 },
        { hpMax: 80, atk: 12, range: 8, speed: 90, cooldown: 0.6 },
      ],
    },
    {
      id: "B",
      fighters: [
        { hpMax: 100, atk: 8, range: 9, speed: 75, cooldown: 0.5 },
        { hpMax: 120, atk: 10, range: 10, speed: 60, cooldown: 0.4 },
        { hpMax: 80, atk: 12, range: 8, speed: 90, cooldown: 0.6 },
      ],
    },
  ],
};

/**
 * 戦術デモ用設定（Aggressive vs Defensive）
 * - チーム順序は味方 -> 敵固定
 */
export const tacticsDemoConfig: BattleConfig = {
  seed: 42,
  arenaRadius: 220,
  tickRate: 60,
  teams: [
    {
      id: "Aggressive",
      fighters: [
        {
          hpMax: 120,
          atk: 10,
          range: 9,
          speed: 75,
          cooldown: 0.45,
          tacticId: "aggressive",
        },
      ],
    },
    {
      id: "Defensive",
      fighters: [
        {
          hpMax: 120,
          atk: 10,
          range: 9,
          speed: 75,
          cooldown: 0.45,
          tacticId: "defensive",
        },
      ],
    },
  ],
};

/**
 * 混合戦術 3v3設定（各チームに異なる戦術IDが混在）
 * - チーム順序は味方 -> 敵固定
 */
export const mixedTactics3v3: BattleConfig = {
  seed: 777,
  arenaRadius: 220,
  tickRate: 60,
  teams: [
    {
      id: "A",
      fighters: [
        {
          hpMax: 100,
          atk: 8,
          range: 9,
          speed: 75,
          cooldown: 0.5,
          tacticId: "aggressive",
        },
        {
          hpMax: 120,
          atk: 10,
          range: 10,
          speed: 60,
          cooldown: 0.4,
          tacticId: "defensive",
        },
        {
          hpMax: 80,
          atk: 12,
          range: 8,
          speed: 90,
          cooldown: 0.6,
          tacticId: "nearest",
        },
      ],
    },
    {
      id: "B",
      fighters: [
        {
          hpMax: 100,
          atk: 8,
          range: 9,
          speed: 75,
          cooldown: 0.5,
          tacticId: "nearest",
        },
        {
          hpMax: 120,
          atk: 10,
          range: 10,
          speed: 60,
          cooldown: 0.4,
          tacticId: "aggressive",
        },
        {
          hpMax: 80,
          atk: 12,
          range: 8,
          speed: 90,
          cooldown: 0.6,
          tacticId: "defensive",
        },
      ],
    },
  ],
};

/**
 * 利用可能なプリセット一覧
 */
export const presets = {
  "1v1 (default)": defaults,
  "3v3": defaults3v3,
  "Tactics Demo (Aggressive vs Defensive)": tacticsDemoConfig,
  "Mixed Tactics 3v3": mixedTactics3v3,
} as const;

export type PresetName = keyof typeof presets;
