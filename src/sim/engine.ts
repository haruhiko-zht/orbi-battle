import type { BattleConfig, BattleState, FighterState, Vec2 } from "./types";
import { makeRng } from "./rng";

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
 * ベクトルを正規化（長さ1にする）
 * @param x X成分
 * @param y Y成分
 * @returns 正規化されたベクトル
 */
function norm(x: number, y: number) {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
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
   * 最も近い生存している敵を選択
   * @param self 行動するファイター
   * @returns ターゲット（いなければ null）
   */
  private pickNearestTarget(self: FighterState): FighterState | null {
    const enemies = this.state.fighters.filter(
      (f) => f.alive && f.teamId !== self.teamId
    );

    if (enemies.length === 0) return null;

    let nearest = enemies[0];
    let minDist = Math.hypot(
      nearest.pos.x - self.pos.x,
      nearest.pos.y - self.pos.y
    );

    for (const enemy of enemies) {
      const dist = Math.hypot(
        enemy.pos.x - self.pos.x,
        enemy.pos.y - self.pos.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * ファイター1体の1フレーム分の行動処理
   * - クールダウン減少
   * - 移動または攻撃の判定
   * - 境界チェック
   *
   * @param self 行動するファイター
   */
  private stepFighter(self: FighterState) {
    if (!self.alive) return;

    // ターゲット選択
    const target = this.pickNearestTarget(self);
    if (!target) return; // 敵が全滅していれば何もしない

    const dx = target.pos.x - self.pos.x;
    const dy = target.pos.y - self.pos.y;
    const dist = Math.hypot(dx, dy);

    // クールダウン更新
    if (self.cooldown > 0) {
      self.cooldown = Math.max(0, self.cooldown - this.dt);
    }

    // 基本AI: 射程外なら接近、射程内なら攻撃
    const p = self.params;
    if (dist > p.range) {
      // 敵に向かって移動
      const v = norm(dx, dy);
      self.pos.x += v.x * p.speed * this.dt;
      self.pos.y += v.y * p.speed * this.dt;
    } else {
      // 攻撃判定
      if (self.cooldown === 0 && target.alive) {
        target.hp -= p.atk;
        self.cooldown = p.cooldown;
        if (target.hp <= 0) {
          target.alive = false;
          target.hp = 0;
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
