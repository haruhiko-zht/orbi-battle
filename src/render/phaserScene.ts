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
  /** レイアウト前提を警告済みかどうか */
  private warnedTeamLayout = false;

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
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.sim = new BattleSim(this.cfg);
    this.initializeTeamColors(this.cfg);
    this.warnedTeamLayout = false;

    // アリーナ（円形境界）
    this.arena = this.add
      .circle(cx, cy, this.cfg.arenaRadius, 0x0, ARENA.fillAlpha)
      .setStrokeStyle(ARENA.strokeWidth, ARENA.strokeColor);

    // 全ファイターの描画オブジェクトを動的に生成
    const initialState = this.sim.fixedUpdate(0);
    this.buildFighterObjects(initialState, cx, cy);

    // 勝敗表示
    this.result = this.add.text(RESULT_TEXT.x, RESULT_TEXT.y, "", {
      color: RESULT_TEXT.color,
    });

    // デバッグUI用のグローバルAPI
    window.$orbi = {
      ...(window.$orbi ?? {}),
      reset: (cfg: BattleConfig) => this.reset(cfg),
      getLog: () => this.sim.getLog(),
    };

    // 初期状態を描画
    this.renderState(initialState);
  }

  /**
   * バトルをリセット（デバッグUI から呼ばれる）
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.cfg = structuredClone(cfg);
    this.sim.reset(this.cfg);
    this.initializeTeamColors(this.cfg);
    this.warnedTeamLayout = false;

    // 既存の描画オブジェクトを全て削除
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

    // 新しいファイター構成で描画オブジェクトを再生成
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const initialState = this.sim.fixedUpdate(0);
    this.buildFighterObjects(initialState, cx, cy);

    this.renderState(initialState);
  }

  /**
   * 毎フレーム更新（Phaserが自動的に呼び出す）
   * @param _time 経過時間（未使用）
   * @param delta 前フレームからの経過時間 [ミリ秒]
   */
  override update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, FRAME_CONTROL.maxDeltaTime); // 大きなフレーム落ちを抑制
    const state = this.sim.fixedUpdate(dt);
    this.renderState(state);
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

    // HPバーの描画：teams[0] を味方（右列）、teams[1] を敵（左列）として扱う
    const w = HP_BAR.width;
    const h = HP_BAR.height;
    const pad = HP_BAR.padding;
    const leftOffset = HP_BAR.leftOffset;
    const orderedFighters = this.getSortedFighters(state.fighters);
    if (this.cfg.teams.length === 2) {
      const allyTeamId = this.cfg.teams[0]?.id;
      const enemyTeamId = this.cfg.teams[1]?.id;
      const allyFighters = orderedFighters.filter(
        (fighter) => fighter.teamId === allyTeamId
      );
      const enemyFighters = orderedFighters.filter((fighter) => {
        if (!enemyTeamId) return fighter.teamId !== allyTeamId;
        return fighter.teamId === enemyTeamId;
      });

      let yOffsetLeft = this.scale.height - h;
      for (const fighter of enemyFighters) {
        const hpBar = this.fighterHpBars.get(fighter.id);
        const hpText = this.fighterHpTexts.get(fighter.id);
        if (!hpBar || !hpText) continue;
        this.renderHpBar(fighter, hpBar, hpText, leftOffset, yOffsetLeft, w, h);
        yOffsetLeft -= h + pad;
      }

      const rightOffset = this.scale.width - w - leftOffset;
      let yOffsetRight = this.scale.height - h;
      for (const fighter of allyFighters) {
        const hpBar = this.fighterHpBars.get(fighter.id);
        const hpText = this.fighterHpTexts.get(fighter.id);
        if (!hpBar || !hpText) continue;
        this.renderHpBar(
          fighter,
          hpBar,
          hpText,
          rightOffset,
          yOffsetRight,
          w,
          h
        );
        yOffsetRight -= h + pad;
      }
    } else {
      this.warnInvalidTeamLayout(this.cfg.teams.length);
      let yOffset = this.scale.height - h;
      for (const fighter of orderedFighters) {
        const hpBar = this.fighterHpBars.get(fighter.id);
        const hpText = this.fighterHpTexts.get(fighter.id);
        if (!hpBar || !hpText) continue;
        this.renderHpBar(fighter, hpBar, hpText, leftOffset, yOffset, w, h);
        yOffset -= h + pad;
      }
    }

    this.result.setText(state.winner ? `WINNER: ${state.winner}` : "");
  }

  /**
   * 初期状態に合わせて描画オブジェクトを生成
   */
  private buildFighterObjects(state: BattleState, cx: number, cy: number) {
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
   * チームカラーを初期化
   */
  private initializeTeamColors(cfg: BattleConfig) {
    this.teamColors.clear();
    cfg.teams.forEach((team, index) => {
      const color = TEAM_COLOR_PALETTE[index % TEAM_COLOR_PALETTE.length];
      this.teamColors.set(team.id, color);
    });
  }

  /**
   * チームごとの色を取得（未登録の場合はパレットから割り当て）
   */
  private getTeamColor(teamId: string): number {
    if (!this.teamColors.has(teamId)) {
      const color =
        TEAM_COLOR_PALETTE[this.teamColors.size % TEAM_COLOR_PALETTE.length];
      this.teamColors.set(teamId, color);
    }
    return this.teamColors.get(teamId)!;
  }

  /**
   * 表示用にファイターをチーム順で並び替える
   */
  private getSortedFighters(fighters: FighterState[]): FighterState[] {
    const teamOrder = this.cfg.teams.map((team) => team.id);
    return [...fighters].sort((a, b) => {
      const teamDiff =
        teamOrder.indexOf(a.teamId) - teamOrder.indexOf(b.teamId);
      if (teamDiff !== 0) return teamDiff;
      return a.id.localeCompare(b.id);
    });
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
   * レイアウト前提に合わない構成を受け取った際に警告
   */
  private warnInvalidTeamLayout(teamCount: number) {
    if (this.warnedTeamLayout) return;
    console.warn(
      `[BattleScene] HPレイアウトは2チーム前提です。受信チーム数: ${teamCount}。単一列表示にフォールバックします。`
    );
    this.warnedTeamLayout = true;
  }
}
