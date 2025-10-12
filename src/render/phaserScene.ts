import Phaser from "phaser";
import type { BattleConfig, BattleState, FighterState } from "../sim/types";
import { BattleSim } from "../sim/battle";
import { defaults3v3 } from "../config/defaults";
import {
  BACKGROUND_COLOR,
  ARENA,
  FIGHTER,
  FIGHTER_RANGE,
  HP_BAR,
  HP_TEXT,
  RESULT_TEXT,
  TEAM_COLOR_PALETTE,
  FRAME_CONTROL,
} from "../config/renderConstants";
import {
  resolveBattleSides,
  resolveFighterSides,
  type BattleSides,
} from "../sim/sides";
import type { PlaybackInfo } from "../types/playback";

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
  /** ファイターの描画オブジェクトマップ（ファイターID -> 円形） */
  fighters: Map<string, Phaser.GameObjects.Arc> = new Map();
  /** ファイター攻撃範囲の描画オブジェクトマップ（ファイターID -> 円形） */
  fighterRanges: Map<string, Phaser.GameObjects.Arc> = new Map();
  /** ファイターのHPバーマップ（ファイターID -> Graphics） */
  fighterHpBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  /** ファイターのHPテキストマップ（ファイターID -> Text） */
  fighterHpTexts: Map<string, Phaser.GameObjects.Text> = new Map();
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
    this.initializeSimulation(this.cfg);
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.setupArena();
    this.buildFighterObjects(this.currentState);
    this.setupResultText();
    this.setupGlobalApi();
    this.renderState(this.currentState);
  }

  /**
   * バトルをリセット（デバッグUI から呼ばれる）
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.destroyFighterObjects();
    this.initializeSimulation(cfg);
    this.setupArena();
    this.buildFighterObjects(this.currentState);
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
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // 全ファイターの位置を更新
    for (const fighter of state.fighters) {
      const circle = this.fighters.get(fighter.id);
      const rangeCircle = this.fighterRanges.get(fighter.id);
      const color = this.getTeamColor(fighter.teamId);
      if (circle) {
        circle.setPosition(cx + fighter.pos.x, cy + fighter.pos.y);
        // 死亡時は半透明に
        circle.setAlpha(fighter.alive ? FIGHTER.aliveAlpha : FIGHTER.deadAlpha);
      }
      if (rangeCircle) {
        const strokeAlpha = fighter.alive
          ? FIGHTER_RANGE.strokeAlphaAlive
          : FIGHTER_RANGE.strokeAlphaDead;
        const fillAlpha = fighter.alive
          ? FIGHTER_RANGE.fillAlphaAlive
          : FIGHTER_RANGE.fillAlphaDead;
        rangeCircle
          .setPosition(cx + fighter.pos.x, cy + fighter.pos.y)
          .setFillStyle(color, fillAlpha)
          .setStrokeStyle(FIGHTER_RANGE.strokeWidth, color, strokeAlpha);
      }
    }

    // HPバーの描画：味方（右列）・敵（左列）
    const w = HP_BAR.width;
    const h = HP_BAR.height;
    const pad = HP_BAR.padding;
    const leftOffset = HP_BAR.leftOffset;
    const rightOffset = this.scale.width - w - leftOffset;
    const { ally, enemy } = resolveFighterSides(state, this.sides);

    let yOffsetEnemy = this.scale.height - h;
    for (const fighter of enemy) {
      const hpBar = this.fighterHpBars.get(fighter.id);
      const hpText = this.fighterHpTexts.get(fighter.id);
      if (!hpBar || !hpText) continue;
      this.renderHpBar(fighter, hpBar, hpText, leftOffset, yOffsetEnemy, w, h);
      yOffsetEnemy -= h + pad;
    }

    let yOffsetAlly = this.scale.height - h;
    for (const fighter of ally) {
      const hpBar = this.fighterHpBars.get(fighter.id);
      const hpText = this.fighterHpTexts.get(fighter.id);
      if (!hpBar || !hpText) continue;
      this.renderHpBar(fighter, hpBar, hpText, rightOffset, yOffsetAlly, w, h);
      yOffsetAlly -= h + pad;
    }

    this.result.setText(state.winner ? `WINNER: ${state.winner}` : "");
  }

  /**
   * 初期状態に合わせて描画オブジェクトを生成
   */
  private buildFighterObjects(state: BattleState) {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    for (const fighter of state.fighters) {
      const color = this.getTeamColor(fighter.teamId);
      // 攻撃範囲の可視化（デバッグ向け）
      const rangeCircle = this.add
        .circle(
          cx,
          cy,
          fighter.params.range,
          color,
          FIGHTER_RANGE.fillAlphaAlive
        )
        .setStrokeStyle(
          FIGHTER_RANGE.strokeWidth,
          color,
          FIGHTER_RANGE.strokeAlphaAlive
        );
      this.fighterRanges.set(fighter.id, rangeCircle);

      const circle = this.add.circle(cx, cy, FIGHTER.radius, color);
      this.fighters.set(fighter.id, circle);

      const hpBar = this.add.graphics();
      this.fighterHpBars.set(fighter.id, hpBar);

      const hpText = this.add.text(0, 0, "", {
        color: HP_TEXT.color,
        fontSize: HP_TEXT.fontSize,
        fontFamily: HP_TEXT.fontFamily,
      });
      this.fighterHpTexts.set(fighter.id, hpText);
    }
  }

  /**
   * 既存の描画オブジェクトを破棄
   */
  private destroyFighterObjects() {
    for (const circle of this.fighters.values()) {
      circle.destroy();
    }
    for (const rangeCircle of this.fighterRanges.values()) {
      rangeCircle.destroy();
    }
    for (const hpBar of this.fighterHpBars.values()) {
      hpBar.destroy();
    }
    for (const hpText of this.fighterHpTexts.values()) {
      hpText.destroy();
    }
    this.fighters.clear();
    this.fighterRanges.clear();
    this.fighterHpBars.clear();
    this.fighterHpTexts.clear();
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

  /**
   * HPバーを描画（共通処理）
   */
  private renderHpBar(
    fighter: FighterState,
    hpBar: Phaser.GameObjects.Graphics,
    hpText: Phaser.GameObjects.Text,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    hpBar.clear();
    const ratio = fighter.params.hpMax
      ? Phaser.Math.Clamp(fighter.hp / fighter.params.hpMax, 0, 1)
      : 0;
    const color = this.getTeamColor(fighter.teamId);

    hpBar.fillStyle(HP_BAR.backgroundColor).fillRect(x, y, width, height);
    hpBar.fillStyle(color).fillRect(x, y, width * ratio, height);

    const text = `${fighter.id}: ${fighter.hp.toFixed(1)} / ${
      fighter.params.hpMax
    }`;
    hpText.setText(text);
    hpText.setPosition(
      x + width / 2 - hpText.width / 2,
      y + height / 2 - hpText.height / 2
    );
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
