import type { BattleConfig, BattleState, FighterState, Vec2 } from "./types";
import { makeRng } from "./rng";
import { getAI } from "./ai";
import { validateBattleConfig } from "./validation";

/**
 * 位置を円形境界内にクランプする
 * @param p 位置ベクトル
 * @param r 円の半径
 * @returns クランプされた位置
 */
function clampToCircle(p: Vec2, r: number): Vec2 {
  const d2 = p.x * p.x + p.y * p.y;
  if (d2 <= r * r) return p;
  const d = Math.sqrt(d2);
  return { x: (p.x / d) * r, y: (p.y / d) * r };
}

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

  constructor(cfg: BattleConfig) {
    validateBattleConfig(cfg);
    this.cfg = cfg;
    this.dt = 1 / cfg.tickRate;
    this.rng = makeRng(cfg.seed);

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

    // クールダウン更新
    if (self.cooldown > 0) {
      self.cooldown = Math.max(0, self.cooldown - this.dt);
    }

    // 移動処理
    if (decision.moveDirection) {
      const { x, y } = decision.moveDirection;
      const mag = Math.hypot(x, y);
      if (mag > 0) {
        const nx = x / mag;
        const ny = y / mag;
        self.pos.x += nx * self.params.speed * this.dt;
        self.pos.y += ny * self.params.speed * this.dt;
      }
    }

    // 攻撃処理
    if (decision.targetId && self.cooldown === 0) {
      const target = this.state.fighters.find(
        (f) => f.id === decision.targetId
      );
      if (target && target.alive) {
        // 射程チェック
        const dist = Math.hypot(
          target.pos.x - self.pos.x,
          target.pos.y - self.pos.y
        );
        if (dist <= self.params.range) {
          target.hp -= self.params.atk;
          self.cooldown = self.params.cooldown;
          if (target.hp <= 0) {
            target.alive = false;
            target.hp = 0;
          }
        }
      }
    }

    // 円形境界にクランプ（アリーナ外に出ないようにする）
    self.pos = clampToCircle(self.pos, this.cfg.arenaRadius);
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
