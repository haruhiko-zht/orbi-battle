import type { BattleConfig } from "../sim/types";

/**
 * デフォルトのバトル設定（1 vs 1）
 * - 初回起動時に使用される
 * - デバッグパネルの初期値にもなる
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
          range: 36,
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
          range: 36,
          speed: 75,
          cooldown: 0.45,
        },
      ],
    },
  ],
};

/**
 * 3 vs 3 のテスト用設定
 */
export const defaults3v3: BattleConfig = {
  seed: 123456,
  arenaRadius: 220,
  tickRate: 60,
  teams: [
    {
      id: "A",
      fighters: [
        { hpMax: 100, atk: 8, range: 36, speed: 75, cooldown: 0.5 },
        { hpMax: 120, atk: 10, range: 40, speed: 60, cooldown: 0.4 },
        { hpMax: 80, atk: 12, range: 30, speed: 90, cooldown: 0.6 },
      ],
    },
    {
      id: "B",
      fighters: [
        { hpMax: 100, atk: 8, range: 36, speed: 75, cooldown: 0.5 },
        { hpMax: 120, atk: 10, range: 40, speed: 60, cooldown: 0.4 },
        { hpMax: 80, atk: 12, range: 30, speed: 90, cooldown: 0.6 },
      ],
    },
  ],
};

/**
 * AI 対戦デモ用設定（AggressiveAI vs DefensiveAI）
 */
export const aiDemoConfig: BattleConfig = {
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
          range: 36,
          speed: 75,
          cooldown: 0.45,
          aiType: "aggressive",
        },
      ],
    },
    {
      id: "Defensive",
      fighters: [
        {
          hpMax: 120,
          atk: 10,
          range: 36,
          speed: 75,
          cooldown: 0.45,
          aiType: "defensive",
        },
      ],
    },
  ],
};

/**
 * 混合AI 3v3設定（各チームに異なるAIタイプが混在）
 */
export const mixedAI3v3: BattleConfig = {
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
          range: 36,
          speed: 75,
          cooldown: 0.5,
          aiType: "aggressive",
        },
        {
          hpMax: 120,
          atk: 10,
          range: 40,
          speed: 60,
          cooldown: 0.4,
          aiType: "defensive",
        },
        {
          hpMax: 80,
          atk: 12,
          range: 30,
          speed: 90,
          cooldown: 0.6,
          aiType: "nearest",
        },
      ],
    },
    {
      id: "B",
      fighters: [
        {
          hpMax: 100,
          atk: 8,
          range: 36,
          speed: 75,
          cooldown: 0.5,
          aiType: "nearest",
        },
        {
          hpMax: 120,
          atk: 10,
          range: 40,
          speed: 60,
          cooldown: 0.4,
          aiType: "aggressive",
        },
        {
          hpMax: 80,
          atk: 12,
          range: 30,
          speed: 90,
          cooldown: 0.6,
          aiType: "defensive",
        },
      ],
    },
  ],
};
