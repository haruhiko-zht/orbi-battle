import type { BattleConfig, BattleState } from "../sim/types";
import { BattleSim } from "../sim/battle";
import type { BattleLog } from "../sim/log";
import type { PlaybackInfo } from "../types/playback";
import { BattlePlaybackController } from "./playbackController";

export type BattleRuntimeHooks = {
  onSimulationReset?: (state: BattleState, config: BattleConfig) => void;
  onStateChanged?: (state: BattleState) => void;
};

/**
 * BattleSim と再生制御、および window.$orbi 橋渡しを担当するコントローラ
 */
export class BattleRuntimeController {
  private sim: BattleSim;
  private playback: BattlePlaybackController;
  private config: BattleConfig;

  constructor(
    initialConfig: BattleConfig,
    private readonly hooks: BattleRuntimeHooks = {}
  ) {
    this.config = structuredClone(initialConfig);
    this.sim = new BattleSim(this.config);
    this.playback = new BattlePlaybackController(this.sim);
    this.publishGlobalApi();
  }

  /**
   * 毎フレームの更新を処理し、状態変化があればフックに通知
   */
  update(deltaMs: number): BattleState | null {
    const nextState = this.playback.update(deltaMs);
    if (nextState) {
      this.hooks.onStateChanged?.(nextState);
    }
    return nextState;
  }

  /**
   * バトルを新しい設定でリセット
   */
  reset(cfg: BattleConfig): BattleState {
    this.config = structuredClone(cfg);
    this.sim.reset(this.config);
    this.playback.attachSimulation(this.sim);
    const state = this.sim.getCurrentState();
    this.hooks.onSimulationReset?.(state, this.getConfig());
    return state;
  }

  play() {
    this.playback.play();
  }

  pause() {
    this.playback.pause();
  }

  stepFrame(): BattleState {
    const state = this.playback.step();
    this.hooks.onStateChanged?.(state);
    return state;
  }

  seekFrame(frameIndex: number): BattleState {
    const state = this.playback.seek(frameIndex);
    this.hooks.onStateChanged?.(state);
    return state;
  }

  setPlaybackRate(rate: number) {
    this.playback.setPlaybackRate(rate);
  }

  getPlaybackInfo(): PlaybackInfo {
    return this.playback.getPlaybackInfo();
  }

  getLog(): BattleLog {
    return this.sim.getLog();
  }

  getCurrentState(): BattleState {
    return this.sim.getCurrentState();
  }

  getConfig(): BattleConfig {
    return this.sim.getConfig();
  }

  private publishGlobalApi() {
    window.$orbi = {
      ...(window.$orbi ?? {}),
      reset: (cfg: BattleConfig) => this.reset(cfg),
      getLog: () => this.getLog(),
      play: () => this.play(),
      pause: () => this.pause(),
      stepFrame: () => this.stepFrame(),
      seekFrame: (frameIndex: number) => this.seekFrame(frameIndex),
      setPlaybackRate: (rate: number) => this.setPlaybackRate(rate),
      getPlaybackInfo: () => this.getPlaybackInfo(),
    };
  }
}
