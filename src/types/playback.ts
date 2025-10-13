export type PlaybackInfo = {
  /** 現在のフレーム番号（0始まり） */
  frameIndex: number;
  /** 総フレーム数 */
  frameCount: number;
  /** 再生が一時停止中か */
  isPaused: boolean;
  /** 全フレーム再生済みか */
  isFinished: boolean;
  /** 再生速度（1.0 = 等倍） */
  playbackRate: number;
};
