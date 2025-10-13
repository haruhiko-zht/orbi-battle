import Phaser from "phaser";
import type { BattleConfig, BattleState } from "../sim/types";
import { defaults3v3 } from "../config/defaults";
import {
  BACKGROUND_COLOR,
  ARENA,
  RESULT_TEXT,
  TEAM_COLOR_PALETTE,
} from "../config/renderConstants";
import { resolveBattleSides, type BattleSides } from "../sim/sides";
import { FighterObjectManager, HpHudRenderer } from "./battleLayers";
import { BattleRuntimeController } from "./battleRuntimeController";

/**
 * Phaser バトルシーン
 * - シミュレーション層から状態を取得して描画
 * - 毎フレーム update() が呼ばれて画面を更新
 */
export class BattleScene extends Phaser.Scene {
  /** 現在のバトル設定 */
  cfg: BattleConfig = structuredClone(defaults3v3);
  /** シミュレーション制御 */
  private runtime!: BattleRuntimeController;
  /** 味方/敵チーム情報 */
  private sides!: BattleSides;
  /** 現在描画中の状態 */
  private currentState!: BattleState;
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

  private handleSimulationReset = (state: BattleState, cfg: BattleConfig) => {
    this.cfg = structuredClone(cfg);
    this.sides = resolveBattleSides(this.cfg);
    this.currentState = state;
    this.initializeTeamColors();
    this.setupArena();
    this.rebuildVisuals();
    this.renderState(state);
  };

  private handleStateChange = (state: BattleState) => {
    this.currentState = state;
    this.renderState(state);
  };

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
    this.runtime = new BattleRuntimeController(this.cfg, {
      onSimulationReset: this.handleSimulationReset,
      onStateChanged: this.handleStateChange,
    });
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.setupResultText();
    this.handleSimulationReset(
      this.runtime.getCurrentState(),
      this.runtime.getConfig()
    );
  }

  /**
   * バトルをリセット（デバッグUI から呼ばれる）
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.runtime.reset(cfg);
  }

  /**
   * 毎フレーム更新（Phaserが自動的に呼び出す）
   * @param _time 経過時間（未使用）
   * @param delta 前フレームからの経過時間 [ミリ秒]
   */
  override update(_time: number, delta: number) {
    if (!this.runtime) return;
    this.runtime.update(delta);
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
}
