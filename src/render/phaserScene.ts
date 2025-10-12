import Phaser from "phaser";
import type { BattleConfig, BattleState, FighterState } from "../sim/types";
import { BattleSim } from "../sim/battle";
import { defaults, defaults3v3 } from "../config/defaults";

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
  /** ファイターのHPバーマップ（ファイターID -> Graphics） */
  fighterHpBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  /** ファイターのHPテキストマップ（ファイターID -> Text） */
  fighterHpTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  /** チームカラーのマップ（チームID -> 16進カラー値） */
  private teamColors: Map<string, number> = new Map();
  /** 勝敗表示テキスト */
  result!: Phaser.GameObjects.Text;

  private static readonly colorPalette = [
    0x7bd389, // soft green
    0xf97070, // soft red
    0x6cc0f7, // sky blue
    0xf7f36c, // warm yellow
    0xc27bf7, // lavender
    0xf79bd1, // pink
  ];

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
    this.cameras.main.setBackgroundColor("#0e0f13");
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.sim = new BattleSim(this.cfg);
    this.initializeTeamColors(this.cfg);

    // アリーナ（円形境界）
    this.arena = this.add
      .circle(cx, cy, this.cfg.arenaRadius, 0x0, 0)
      .setStrokeStyle(2, 0x4a90e2);

    // 全ファイターの描画オブジェクトを動的に生成
    const initialState = this.sim.fixedUpdate(0);
    this.buildFighterObjects(initialState, cx, cy);

    // 勝敗表示
    this.result = this.add.text(12, 12, "", { color: "#ffffff" });

    // デバッグUI用のグローバルAPI
    // @ts-expect-error
    window.$orbi = {
      ...((window as any).$orbi ?? {}),
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

    // 既存の描画オブジェクトを全て削除
    for (const circle of this.fighters.values()) {
      circle.destroy();
    }
    for (const hpBar of this.fighterHpBars.values()) {
      hpBar.destroy();
    }
    for (const hpText of this.fighterHpTexts.values()) {
      hpText.destroy();
    }
    this.fighters.clear();
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
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05); // 大きなフレーム落ちを抑制
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
      if (circle) {
        circle.setPosition(cx + fighter.pos.x, cy + fighter.pos.y);
        // 死亡時は半透明に
        circle.setAlpha(fighter.alive ? 1.0 : 0.3);
      }
    }

    // HPバーの描画（下から上に縦積み）
    const w = 320;
    const h = 8;
    const pad = 2;
    let yOffset = this.scale.height - h;
    const orderedFighters = this.getSortedFighters(state.fighters);

    for (const fighter of orderedFighters) {
      const hpBar = this.fighterHpBars.get(fighter.id);
      const hpText = this.fighterHpTexts.get(fighter.id);
      if (!hpBar || !hpText) continue;

      hpBar.clear();
      const ratio = fighter.params.hpMax
        ? fighter.hp / fighter.params.hpMax
        : 0;
      const color = this.getTeamColor(fighter.teamId);

      // 背景バー
      hpBar.fillStyle(0x333333).fillRect(20, yOffset, w, h);
      // 残量バー
      hpBar.fillStyle(color).fillRect(20, yOffset, w * ratio, h);

      // HPテキスト
      const text = `${fighter.id}: ${fighter.hp.toFixed(1)} / ${
        fighter.params.hpMax
      }`;
      hpText.setText(text);
      hpText.setPosition(
        20 + w / 2 - hpText.width / 2,
        yOffset + h / 2 - hpText.height / 2
      );

      yOffset -= h + pad;
    }

    this.result.setText(state.winner ? `WINNER: ${state.winner}` : "");
  }

  /**
   * 初期状態に合わせて描画オブジェクトを生成
   */
  private buildFighterObjects(state: BattleState, cx: number, cy: number) {
    for (const fighter of state.fighters) {
      const color = this.getTeamColor(fighter.teamId);
      const circle = this.add.circle(cx, cy, 10, color);
      this.fighters.set(fighter.id, circle);

      const hpBar = this.add.graphics();
      this.fighterHpBars.set(fighter.id, hpBar);

      const hpText = this.add.text(0, 0, "", {
        color: "#ffffff",
        fontSize: "12px",
        fontFamily: "monospace",
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
      const palette = BattleScene.colorPalette;
      const color = palette[index % palette.length];
      this.teamColors.set(team.id, color);
    });
  }

  /**
   * チームごとの色を取得（未登録の場合はパレットから割り当て）
   */
  private getTeamColor(teamId: string): number {
    if (!this.teamColors.has(teamId)) {
      const palette = BattleScene.colorPalette;
      const color = palette[this.teamColors.size % palette.length];
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
}
