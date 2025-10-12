import type { BattleConfig, BattleState } from "./types";
import { Engine } from "./engine";
import { type BattleLog, cloneConfig, cloneState } from "./log";
import { assertFinitePositive, validateBattleConfig } from "./validation";

/** デフォルトの最大シミュレーション時間 [秒] */
const DEFAULT_MAX_SECONDS = 60;

/**
 * simulateBattle オプションの妥当性を検証
 */
function validateSimulateBattleOptions(opts?: { maxSeconds?: number }) {
  if (typeof opts === "undefined") return;
  if (typeof opts.maxSeconds === "undefined") return;
  assertFinitePositive(opts.maxSeconds, "simulateBattle(opts).maxSeconds");
}

/**
 * バトル全体を事前にシミュレートして結果をログに記録
 * - 開始から終了（または最大時間）までを一気に計算
 * - 結果はリプレイ、デバッグに利用可能
 *
 * @param cfg バトル設定
 * @param opts オプション（最大シミュレーション時間）
 * @returns 全フレームを含むバトルログ
 */
export function simulateBattle(
  cfg: BattleConfig,
  opts?: { maxSeconds?: number }
): BattleLog {
  validateBattleConfig(cfg);
  validateSimulateBattleOptions(opts);

  const engine = new Engine(cfg);
  const frames: BattleState[] = [cloneState(engine.state)];
  const maxSeconds = opts?.maxSeconds ?? DEFAULT_MAX_SECONDS;
  const maxFrames = Math.max(1, Math.ceil(cfg.tickRate * maxSeconds));

  for (let i = 0; i < maxFrames; i += 1) {
    if (engine.state.winner) break;
    engine.update();
    frames.push(cloneState(engine.state));
    if (engine.state.winner) break;
  }

  return {
    version: 2,
    config: cloneConfig(cfg),
    frames,
  };
}

/**
 * バトルシミュレーター（リプレイヤー）
 * - 事前計算されたログを固定タイムステップで再生
 * - 描画層（Phaser）はこのクラスから状態を取得して描画
 */
export class BattleSim {
  /** 事前計算されたバトルログ */
  private log: BattleLog;
  /** 現在のフレームインデックス */
  private frameIndex = 0;
  /** 現在表示中の状態（フレームのコピー） */
  private state: BattleState;
  /** 再生中フラグ */
  running = true;

  constructor(cfg: BattleConfig) {
    this.log = simulateBattle(cfg);
    this.state = cloneState(this.log.frames[0]);
  }

  /**
   * 新しい設定でバトルをリセット
   * - 新たにシミュレーションを実行してログを生成
   *
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.log = simulateBattle(cfg);
    this.frameIndex = 0;
    this.state = cloneState(this.log.frames[0]);
    this.running = true;
  }

  /**
   * 現在の表示状態を取得
   */
  getCurrentState(): BattleState {
    return this.state;
  }

  /**
   * 1フレーム先へ進める
   * - 末尾に達した場合は終了扱い
   */
  step(): BattleState {
    if (!this.running) {
      return this.state;
    }
    if (this.frameIndex >= this.log.frames.length - 1) {
      this.running = false;
      return this.state;
    }
    this.frameIndex += 1;
    this.state = cloneState(this.log.frames[this.frameIndex]);
    if (this.frameIndex >= this.log.frames.length - 1) {
      this.running = false;
    }
    return this.state;
  }

  /**
   * 任意フレームへシーク
   * - 範囲外はクランプ
   */
  seek(frame: number): BattleState {
    const upper = this.log.frames.length - 1;
    const clamped = Math.min(Math.max(Math.floor(frame), 0), upper);
    this.frameIndex = clamped;
    this.running = clamped < this.log.frames.length - 1;
    this.state = cloneState(this.log.frames[this.frameIndex]);
    return this.state;
  }

  /**
   * 試合終了済みかどうか
   */
  isFinished(): boolean {
    return !this.running;
  }

  /**
   * フレーム総数
   */
  getFrameCount(): number {
    return this.log.frames.length;
  }

  /**
   * 現在のフレーム番号
   */
  getFrameIndex(): number {
    return this.frameIndex;
  }

  /**
   * 1フレームあたりの時間 [秒]
   */
  getFrameDuration(): number {
    return 1 / this.log.config.tickRate;
  }

  /**
   * バトル設定を取得（コピーを返す）
   */
  getConfig(): BattleConfig {
    return cloneConfig(this.log.config);
  }

  /**
   * バトルログ全体を取得
   * - デバッグやサーバー送信に利用
   */
  getLog(): BattleLog {
    return this.log;
  }
}
