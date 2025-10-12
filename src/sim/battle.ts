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
  /** 1フレームあたりの時間 [秒] */
  private dt: number;
  /** 現在表示中の状態（フレームのコピー） */
  private state: BattleState;
  /** 時間蓄積用（固定タイムステップ制御） */
  acc = 0;
  /** 再生中フラグ */
  running = true;

  constructor(cfg: BattleConfig) {
    this.log = simulateBattle(cfg);
    this.dt = 1 / cfg.tickRate;
    this.state = cloneState(this.log.frames[0]);
  }

  /**
   * 固定タイムステップ更新
   * - 外部から可変delta時間を受け取って蓄積
   * - 蓄積が1フレーム分に達したら次のフレームへ進む
   *
   * @param dt 前フレームからの経過時間 [秒]
   * @returns 現在の状態
   */
  fixedUpdate(dt: number): BattleState {
    if (!this.running) return this.state;
    const step = this.dt;
    this.acc += dt;
    while (this.acc >= step) {
      this.advanceFrame();
      this.acc -= step;
    }
    return this.state;
  }

  /**
   * 新しい設定でバトルをリセット
   * - 新たにシミュレーションを実行してログを生成
   *
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.log = simulateBattle(cfg);
    this.dt = 1 / cfg.tickRate;
    this.frameIndex = 0;
    this.state = cloneState(this.log.frames[0]);
    this.acc = 0;
    this.running = true;
  }

  /**
   * バトルログ全体を取得
   * - デバッグやサーバー送信に利用
   */
  getLog(): BattleLog {
    return this.log;
  }

  /**
   * 次のフレームへ進む（内部処理）
   * - ログから次のフレームをコピーして状態を更新
   */
  private advanceFrame() {
    if (this.frameIndex >= this.log.frames.length - 1) {
      this.running = false;
      return;
    }
    this.frameIndex += 1;
    this.state = cloneState(this.log.frames[this.frameIndex]);
    if (this.frameIndex >= this.log.frames.length - 1) {
      this.running = false;
    }
  }
}
