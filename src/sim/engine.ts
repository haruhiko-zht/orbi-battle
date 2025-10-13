import type { BattleConfig, BattleState, FighterState } from "./types";
import { makeRng } from "./rng";
import { getAI } from "./ai";
import { validateBattleConfig } from "./validation";
import {
  createDefaultFighterSystems,
  type FighterSystem,
} from "./systems/fighterSystems";
import type { FighterSystemContext } from "./systems/types";

/**
 * バトルシミュレーションエンジン
 * - 固定タイムステップでバトル状態を更新
 * - 決定論的な動作（同じ設定で同じ結果）
 * - 描画やUIには依存しない純粋なロジック層
 */
export class Engine {
  /** バトル設定（イミュータブル） */
  readonly cfg: BattleConfig;
  /** 1フレームあたりの時間 [秒] */
  readonly dt: number;
  /** 乱数生成器（現在は未使用だが将来の拡張用） */
  private rng: () => number;
  /** 現在のバトル状態（ミュータブル） */
  state: BattleState;
  /** ファイター処理のパイプライン */
  private readonly fighterSystems: FighterSystem[];

  constructor(cfg: BattleConfig) {
    validateBattleConfig(cfg);
    this.cfg = cfg;
    this.dt = 1 / cfg.tickRate;
    this.rng = makeRng(cfg.seed);
    this.fighterSystems = createDefaultFighterSystems();

    // 初期配置: チーム数に応じて円周を等分し、各セクション内で等間隔配置
    const r = cfg.arenaRadius * 0.7;
    const fighters: BattleState["fighters"] = [];
    const teamCount = cfg.teams.length;
    const sectorSpan = (Math.PI * 2) / Math.max(1, teamCount);
    const baseRotation = Math.PI; // チームインデックス0をアリーナ下側に配置

    cfg.teams.forEach((team, teamIndex) => {
      const numFighters = team.fighters.length;
      const startAngle = baseRotation + sectorSpan * teamIndex;
      const step = sectorSpan / Math.max(1, numFighters + 1);

      team.fighters.forEach((params, fighterIndex) => {
        const angle = startAngle + step * (fighterIndex + 1);

        fighters.push({
          id: `${team.id}-${fighterIndex}`,
          teamId: team.id,
          pos: {
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
          },
          hp: params.hpMax,
          cooldown: 0,
          alive: true,
          params,
        });
      });
    });

    this.state = {
      t: 0,
      winner: null,
      fighters,
    };
  }

  /**
   * ファイター1体の1フレーム分の行動処理
   * - AI による意思決定
   * - クールダウン減少
   * - 移動または攻撃の実行
   * - 境界チェック
   *
   * @param self 行動するファイター
   */
  private stepFighter(self: FighterState) {
    if (!self.alive) return;

    // 生存している敵のリストを取得
    const enemies = this.state.fighters.filter(
      (f) => f.alive && f.teamId !== self.teamId
    );

    // 敵が全滅していれば何もしない
    if (enemies.length === 0) return;

    // AI による意思決定
    const aiType = self.params.aiType ?? "nearest";
    const ai = getAI(aiType);
    const decision = ai.decide(self, enemies, this.cfg.arenaRadius);

    const context: FighterSystemContext = {
      self,
      decision,
      state: this.state,
      config: this.cfg,
      dt: this.dt,
    };

    for (const system of this.fighterSystems) {
      system.update(context);
    }
  }

  /**
   * 1フレーム分のシミュレーションを実行
   * - 全ファイターの行動処理
   * - 勝敗判定
   * - 時刻更新
   *
   * @returns 更新後の状態
   */
  update(): BattleState {
    const s = this.state;

    if (!s.winner) {
      // 全ファイターを順次更新
      for (const fighter of s.fighters) {
        this.stepFighter(fighter);
      }

      // 勝敗判定: いずれかのチームが全滅したか確認
      const teamsAlive = new Set(
        s.fighters.filter((f) => f.alive).map((f) => f.teamId)
      );

      if (teamsAlive.size === 1) {
        // 1チームだけ生き残っている
        s.winner = Array.from(teamsAlive)[0];
      } else if (teamsAlive.size === 0) {
        // 全滅（引き分け、稀だが安全のため）
        s.winner = "Draw";
      }

      // 時刻を進める
      s.t += this.dt;
    }

    return s;
  }
}
