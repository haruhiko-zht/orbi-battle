/**
 * グローバル型定義
 * window.$orbi API の型安全性を提供
 */
import type { BattleConfig } from "../sim/types";
import type { BattleLog } from "../sim/log";
import type Phaser from "phaser";
import type { PlaybackInfo } from "./playback";

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
      /** 再生を開始 */
      play: () => void;
      /** 再生を一時停止 */
      pause: () => void;
      /** 毎フレーム進めずに1フレームだけ進行 */
      stepFrame: () => void;
      /** 指定フレームへシーク */
      seekFrame: (frameIndex: number) => void;
      /** 再生速度を設定 */
      setPlaybackRate: (rate: number) => void;
      /** 再生状態を取得 */
      getPlaybackInfo: () => PlaybackInfo;
    };
  }
}

export {};
