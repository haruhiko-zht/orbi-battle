import Phaser from "phaser";
import type { BattleConfig, BattleState } from "../sim/types";
import { BattleSim } from "../sim/battle";
import { defaults } from "../config/defaults";

/**
 * Phaser バトルシーン
 * - シミュレーション層から状態を取得して描画
 * - 毎フレーム update() が呼ばれて画面を更新
 */
export class BattleScene extends Phaser.Scene {
  /** バトルシミュレーター */
  sim!: BattleSim;
  /** 現在のバトル設定 */
  cfg: BattleConfig = structuredClone(defaults);
  /** アリーナ（円形境界）の描画オブジェクト */
  arena!: Phaser.GameObjects.Arc;
  /** ファイターAの描画オブジェクト（緑） */
  a!: Phaser.GameObjects.Arc;
  /** ファイターBの描画オブジェクト（赤） */
  b!: Phaser.GameObjects.Arc;
  /** ファイターAのHPバー */
  aHp!: Phaser.GameObjects.Graphics;
  /** ファイターBのHPバー */
  bHp!: Phaser.GameObjects.Graphics;
  /** ファイターAのHPテキスト */
  aHpText!: Phaser.GameObjects.Text;
  /** ファイターBのHPテキスト */
  bHpText!: Phaser.GameObjects.Text;
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
    this.cameras.main.setBackgroundColor("#0e0f13");
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.sim = new BattleSim(this.cfg);

    // アリーナ（円形境界）
    this.arena = this.add
      .circle(cx, cy, this.cfg.arenaRadius, 0x0, 0)
      .setStrokeStyle(2, 0x4a90e2);

    // ファイター（初期位置は仮、renderStateで更新される）
    this.a = this.add.circle(cx - this.cfg.arenaRadius * 0.7, cy, 10, 0x7bd389);
    this.b = this.add.circle(cx + this.cfg.arenaRadius * 0.7, cy, 10, 0xf97070);

    // HPバー用のGraphicsオブジェクト
    this.aHp = this.add.graphics();
    this.bHp = this.add.graphics();
    this.aHpText = this.add.text(0, 0, "", {
      color: "#ffffff",
      fontSize: "12px",
      fontFamily: "monospace",
    });
    this.bHpText = this.add.text(0, 0, "", {
      color: "#ffffff",
      fontSize: "12px",
      fontFamily: "monospace",
    });

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
    this.renderState(this.sim.fixedUpdate(0));
  }

  /**
   * バトルをリセット（デバッグUI から呼ばれる）
   * @param cfg 新しいバトル設定
   */
  reset(cfg: BattleConfig) {
    this.cfg = structuredClone(cfg);
    this.sim.reset(this.cfg);
    this.renderState(this.sim.fixedUpdate(0));
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

    // Fighters
    // state.pos は原点(0,0)基準 → 画面中心へ移動
    this.a.setPosition(cx + state.a.pos.x, cy + state.a.pos.y);
    this.b.setPosition(cx + state.b.pos.x, cy + state.b.pos.y);

    // HP bars
    const w = 320,
      h = 8;
    const pad = 6;
    this.aHp.clear();
    this.bHp.clear();

    const aRatio = state.a.hp / state.a.params.hpMax;
    const bRatio = state.b.hp / state.b.params.hpMax;

    const aY = this.scale.height - 2 * h - pad;
    const bY = this.scale.height - h;

    // 背景バー
    this.aHp.fillStyle(0x333333).fillRect(20, aY, w, h);
    this.bHp.fillStyle(0x333333).fillRect(20, bY, w, h);

    // 残量バー
    this.aHp.fillStyle(0x7bd389).fillRect(20, aY, w * aRatio, h);
    this.bHp.fillStyle(0xf97070).fillRect(20, bY, w * bRatio, h);

    // HP Text Centered (バー中央に重ねる)
    const aHpText = `${state.a.hp.toFixed(1)} / ${state.a.params.hpMax}`;
    const bHpText = `${state.b.hp.toFixed(1)} / ${state.b.params.hpMax}`;

    this.aHpText.setText(aHpText);
    this.bHpText.setText(bHpText);

    this.aHpText.setPosition(
      20 + w / 2 - this.aHpText.width / 2,
      aY + h / 2 - this.aHpText.height / 2
    );
    this.bHpText.setPosition(
      20 + w / 2 - this.bHpText.width / 2,
      bY + h / 2 - this.bHpText.height / 2
    );

    this.result.setText(state.winner ? `WINNER: ${state.winner}` : "");
  }
}
