import type { BattleConfig } from "../../sim/types";
import type { BattleLog } from "../../sim/log";

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
};

export type OrbiBridge = typeof orbiBridge;
