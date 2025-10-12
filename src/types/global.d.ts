/**
 * グローバル型定義
 * window.$orbi API の型安全性を提供
 */
import type { BattleConfig } from "../sim/types";
import type { BattleLog } from "../sim/log";
import type Phaser from "phaser";

declare global {
  interface Window {
    /**
     * Orbi Battle グローバルAPI
     * - デバッグパネルとの連携
     * - コンソールからの操作
     */
    $orbi: {
      /** Phaserゲームインスタンス */
      game: Phaser.Game;
      /** バトルをリセット */
      reset: (cfg: BattleConfig) => void;
      /** 現在のバトルログを取得 */
      getLog: () => BattleLog;
    };
  }
}

export {};
