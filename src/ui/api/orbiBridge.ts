import type { BattleConfig } from "../../sim/types";
import type { BattleLog } from "../../sim/log";
import type { PlaybackInfo } from "../../types/playback";

/**
 * window.$orbi を安全にラップしたUI層用の橋渡し
 */
export const orbiBridge = {
  reset(cfg: BattleConfig) {
    window.$orbi?.reset?.(cfg);
  },
  getLog(): BattleLog | undefined {
    return window.$orbi?.getLog?.();
  },
  play() {
    window.$orbi?.play?.();
  },
  pause() {
    window.$orbi?.pause?.();
  },
  stepFrame() {
    window.$orbi?.stepFrame?.();
  },
  seekFrame(frameIndex: number) {
    window.$orbi?.seekFrame?.(frameIndex);
  },
  setPlaybackRate(rate: number) {
    window.$orbi?.setPlaybackRate?.(rate);
  },
  getPlaybackInfo(): PlaybackInfo | undefined {
    return window.$orbi?.getPlaybackInfo?.();
  },
};

export type OrbiBridge = typeof orbiBridge;
