import { FRAME_CONTROL } from "../config/renderConstants";
import type { BattleSim } from "../sim/battle";
import type { BattleState } from "../sim/types";
import type { PlaybackInfo } from "../types/playback";

/**
 * BattleSim の再生制御を担当するクラス
 * - フレーム蓄積と速度制御を管理
 * - Phaser 非依存のため、ユニットテストしやすい
 */
export class BattlePlaybackController {
  private sim: BattleSim;
  private frameAccumulator = 0;
  private paused = false;
  private playbackRate = 1;

  constructor(simulation: BattleSim) {
    this.sim = simulation;
  }

  /**
   * シミュレーションを差し替えて再生状態を初期化
   */
  attachSimulation(simulation: BattleSim) {
    this.sim = simulation;
    this.resetPlaybackState();
  }

  /**
   * 毎フレームの経過時間を消化し、必要に応じて BattleSim を前進させる
   * @param deltaMs 経過時間 [ms]
   * @returns 進行があった場合の最新 BattleState。進行なしなら null
   */
  update(deltaMs: number): BattleState | null {
    if (this.paused || this.playbackRate <= 0) {
      return null;
    }

    const clampedSeconds = Math.min(deltaMs / 1000, FRAME_CONTROL.maxDeltaTime);
    this.frameAccumulator += clampedSeconds * this.playbackRate;

    const frameDuration = this.sim.getFrameDuration();
    let lastState: BattleState | null = null;

    while (this.frameAccumulator >= frameDuration && !this.sim.isFinished()) {
      this.frameAccumulator -= frameDuration;
      lastState = this.sim.step();
    }

    if (this.sim.isFinished()) {
      this.pause();
    }

    return lastState;
  }

  play() {
    this.paused = false;
    this.frameAccumulator = 0;
  }

  pause() {
    this.paused = true;
    this.frameAccumulator = 0;
  }

  step(): BattleState {
    this.pause();
    return this.sim.step();
  }

  seek(frameIndex: number): BattleState {
    const state = this.sim.seek(frameIndex);
    this.frameAccumulator = 0;
    this.paused = this.sim.isFinished();
    return state;
  }

  setPlaybackRate(rate: number) {
    if (!Number.isFinite(rate)) return;
    const normalized = Math.max(rate, 0);
    this.playbackRate = normalized;
    if (normalized === 0) {
      this.pause();
    }
  }

  getPlaybackInfo(): PlaybackInfo {
    return {
      frameIndex: this.sim.getFrameIndex(),
      frameCount: this.sim.getFrameCount(),
      isPaused: this.paused,
      isFinished: this.sim.isFinished(),
      playbackRate: this.playbackRate,
    };
  }

  private resetPlaybackState() {
    this.frameAccumulator = 0;
    this.paused = false;
    this.playbackRate = 1;
  }
}
