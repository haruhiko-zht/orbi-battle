import Phaser from "phaser";
import type { BattleConfig, BattleState } from "../sim/types";
import { BattleSim } from "../sim/battle";
import { defaults3v3 } from "../config/defaults";
import {
  BACKGROUND_COLOR,
  ARENA,
  RESULT_TEXT,
  TEAM_COLOR_PALETTE,
  FRAME_CONTROL,
} from "../config/renderConstants";
import { resolveBattleSides, type BattleSides } from "../sim/sides";
import type { PlaybackInfo } from "../types/playback";
import { FighterObjectManager, HpHudRenderer } from "./battleLayers";

/**
 * Phaser バトルシーン
 * - シミュレーション層から状態を取得して描画
 * - 毎フレーム update() が呼ばれて画面を更新
 */
export class BattleScene extends Phaser.Scene {
  /** バトルシミュレーター */
  sim!: BattleSim;
  /** 現在のバトル設定 */
  cfg: BattleConfig = structuredClone(defaults3v3);
  /** 味方/敵チーム情報 */
  private sides!: BattleSides;
  /** 現在描画中の状態 */
  private currentState!: BattleState;
  /** ログ再生用の時間蓄積 */
  private frameAccumulator = 0;
  /** 再生一時停止フラグ */
  private isPaused = false;
  /** 再生速度 */
  private playbackRate = 1;
  /** アリーナ（円形境界）の描画オブジェクト */
  arena!: Phaser.GameObjects.Arc;
  /** ファイター描画オブジェクト管理 */
  private fighterObjects!: FighterObjectManager;
  /** HPバー描画管理 */
  private hpHud!: HpHudRenderer;
  /** チームカラーのマップ（チームID -> 16進カラー値） */
  private teamColors: Map<string, number> = new Map();
  /** 勝敗表示テキスト */
  result!: Phaser.GameObjects.Text;

  constructor() {
    super("Battle");
  }

  /**
   * シーンの初期化（Phaserが自動的に呼び出す）
   * - ゲームオブジェクトを生成
   * - シミュレーターを初期化
   * - グローバルAPIを公開
   */
  create() {
    this.fighterObjects = new FighterObjectManager(this);
    this.hpHud = new HpHudRenderer(this);
    this.initializeSimulation(this.cfg);
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.setupArena();
    this.rebuildVisuals();
    this.setupResultText();
    this.setupGlobalApi();
    this.renderState(this.currentState);
  }

  /**
   * バトルをリセット（デバッグUI から呼ばれる）
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.initializeSimulation(cfg);
    this.setupArena();
    this.rebuildVisuals();
    this.renderState(this.currentState);
  }

  /**
   * 毎フレーム更新（Phaserが自動的に呼び出す）
   * @param _time 経過時間（未使用）
   * @param delta 前フレームからの経過時間 [ミリ秒]
   */
  override update(_time: number, delta: number) {
    if (this.isPaused || this.playbackRate <= 0) {
      return;
    }

    const deltaSeconds = Math.min(delta / 1000, FRAME_CONTROL.maxDeltaTime);
    this.frameAccumulator += deltaSeconds * this.playbackRate;

    const frameDuration = this.sim.getFrameDuration();
    let didAdvance = false;

    while (this.frameAccumulator >= frameDuration && !this.sim.isFinished()) {
      this.frameAccumulator -= frameDuration;
      this.currentState = this.sim.step();
      didAdvance = true;
    }

    if (this.sim.isFinished()) {
      this.isPaused = true;
      this.frameAccumulator = 0;
    }

    if (didAdvance) {
      this.renderState(this.currentState);
    }
  }

  /**
   * BattleState を画面に描画
   * - ファイターの位置更新
   * - HPバーの描画
   * - 勝敗表示
   *
   * @param state 描画する状態
   */
  private renderState(state: BattleState) {
    if (!this.fighterObjects || !this.hpHud) return;
    const center = this.getSceneCenter();
    const resolveColor = (teamId: string) => this.getTeamColor(teamId);

    this.fighterObjects.update(state, center, resolveColor);
    this.hpHud.update(
      state,
      this.sides,
      this.scale.width,
      this.scale.height,
      resolveColor
    );

    if (this.result) {
      this.result.setText(state.winner ? `WINNER: ${state.winner}` : "");
    }
  }

  /**
   * シミュレーションと関連状態を初期化
   */
  private initializeSimulation(cfg: BattleConfig) {
    this.cfg = structuredClone(cfg);
    if (this.sim) {
      this.sim.reset(this.cfg);
    } else {
      this.sim = new BattleSim(this.cfg);
    }
    this.currentState = this.sim.getCurrentState();
    this.sides = resolveBattleSides(this.cfg);
    this.initializeTeamColors();
    this.frameAccumulator = 0;
    this.isPaused = false;
    this.playbackRate = 1;
  }

  /**
   * アリーナの描画をセットアップ
   */
  private setupArena() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    if (this.arena) {
      this.arena.destroy();
    }

    this.arena = this.add
      .circle(cx, cy, this.cfg.arenaRadius, 0x0, ARENA.fillAlpha)
      .setStrokeStyle(ARENA.strokeWidth, ARENA.strokeColor);
  }

  /**
   * 描画オブジェクトを現在の状態に合わせて再構築
   */
  private rebuildVisuals() {
    if (!this.fighterObjects || !this.hpHud) return;
    const center = this.getSceneCenter();
    const resolveColor = (teamId: string) => this.getTeamColor(teamId);
    this.fighterObjects.rebuild(this.currentState, center, resolveColor);
    this.hpHud.rebuild(
      this.currentState,
      this.sides,
      this.scale.width,
      this.scale.height,
      resolveColor
    );
  }

  /**
   * 勝敗表示テキストの作成
   */
  private setupResultText() {
    if (this.result) {
      this.result.destroy();
    }
    this.result = this.add.text(RESULT_TEXT.x, RESULT_TEXT.y, "", {
      color: RESULT_TEXT.color,
    });
  }

  /**
   * デバッグUI向けに window.$orbi を更新
   */
  private setupGlobalApi() {
    window.$orbi = {
      ...(window.$orbi ?? {}),
      reset: (cfg: BattleConfig) => this.reset(cfg),
      getLog: () => this.sim.getLog(),
      play: () => this.play(),
      pause: () => this.pause(),
      stepFrame: () => this.stepFrame(),
      seekFrame: (frameIndex: number) => this.seekFrame(frameIndex),
      setPlaybackRate: (rate: number) => this.setPlaybackRate(rate),
      getPlaybackInfo: () => this.getPlaybackInfo(),
    };
  }

  /**
   * チームカラーを初期化
   */
  private initializeTeamColors() {
    this.teamColors.clear();
    const allyColor = TEAM_COLOR_PALETTE[0] ?? 0xffffff;
    const enemyColor = TEAM_COLOR_PALETTE[1] ?? allyColor;
    this.teamColors.set(this.sides.ally.id, allyColor);
    this.teamColors.set(this.sides.enemy.id, enemyColor);
  }

  /**
   * チームごとの色を取得（未登録の場合はパレットから割り当て）
   */
  private getTeamColor(teamId: string): number {
    if (!this.teamColors.has(teamId)) {
      const fallback =
        TEAM_COLOR_PALETTE[this.teamColors.size % TEAM_COLOR_PALETTE.length] ??
        0xffffff;
      this.teamColors.set(teamId, fallback);
    }
    return this.teamColors.get(teamId)!;
  }

  private getSceneCenter() {
    return {
      x: this.scale.width / 2,
      y: this.scale.height / 2,
    };
  }
  /**
   * 再生を開始
   */
  private play() {
    this.isPaused = false;
    this.frameAccumulator = 0;
  }

  /**
   * 再生を一時停止
   */
  private pause() {
    this.isPaused = true;
    this.frameAccumulator = 0;
  }

  /**
   * 再生速度を設定
   */
  private setPlaybackRate(rate: number) {
    if (!Number.isFinite(rate)) return;
    this.playbackRate = Math.max(rate, 0);
  }

  /**
   * 指定フレームへシーク
   */
  private seekFrame(frameIndex: number) {
    this.currentState = this.sim.seek(frameIndex);
    this.frameAccumulator = 0;
    if (this.sim.isFinished()) {
      this.isPaused = true;
    }
    this.renderState(this.currentState);
  }

  /**
   * 1フレームだけ進める
   */
  private stepFrame() {
    this.isPaused = true;
    this.currentState = this.sim.step();
    this.frameAccumulator = 0;
    this.renderState(this.currentState);
  }

  /**
   * 再生情報を取得
   */
  private getPlaybackInfo(): PlaybackInfo {
    return {
      frameIndex: this.sim.getFrameIndex(),
      frameCount: this.sim.getFrameCount(),
      isPaused: this.isPaused,
      isFinished: this.sim.isFinished(),
      playbackRate: this.playbackRate,
    };
  }
}
