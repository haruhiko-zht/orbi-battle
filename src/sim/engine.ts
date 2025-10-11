import type { BattleConfig, BattleState, Vec2 } from "./types";
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

    // 初期配置: アリーナ中心を原点とし、X軸上に対向配置
    const r = cfg.arenaRadius * 0.7;
    this.state = {
      t: 0,
      winner: null,
      a: {
        id: "A",
        pos: { x: -r, y: 0 },
        hp: cfg.fighterA.hpMax,
        cooldown: 0,
        alive: true,
        params: cfg.fighterA,
      },
      b: {
        id: "B",
        pos: { x: +r, y: 0 },
        hp: cfg.fighterB.hpMax,
        cooldown: 0,
        alive: true,
        params: cfg.fighterB,
      },
    };
  }

  /**
   * ファイター1体の1フレーム分の行動処理
   * - クールダウン減少
   * - 移動または攻撃の判定
   * - 境界チェック
   *
   * @param self 行動するファイター
   * @param enemy 相手ファイター
   */
  private stepFighter(self: BattleState["a"], enemy: BattleState["b"]) {
    if (!self.alive) return;
    const dx = enemy.pos.x - self.pos.x;
    const dy = enemy.pos.y - self.pos.y;
    const dist = Math.hypot(dx, dy);

    // クールダウン更新
    if (self.cooldown > 0) self.cooldown = Math.max(0, self.cooldown - this.dt);

    // 基本AI: 射程外なら接近、射程内なら攻撃
    const p = self.params;
    if (dist > p.range) {
      // 敵に向かって移動
      const v = norm(dx, dy);
      self.pos.x += v.x * p.speed * this.dt;
      self.pos.y += v.y * p.speed * this.dt;
    } else {
      // 攻撃判定
      if (self.cooldown === 0 && enemy.alive) {
        enemy.hp -= p.atk;
        self.cooldown = p.cooldown;
        if (enemy.hp <= 0) {
          enemy.alive = false;
          enemy.hp = 0;
        }
      }
    }

    // 円形境界にクランプ（アリーナ外に出ないようにする）
    self.pos = clampToCircle(self.pos, this.cfg.arenaRadius);
  }

  /**
   * 1フレーム分のシミュレーションを実行
   * - 両ファイターの行動処理
   * - 勝敗判定
   * - 時刻更新
   *
   * @returns 更新後の状態
   */
  update(): BattleState {
    const s = this.state;
    if (!s.winner) {
      // 両ファイターを同時に更新
      this.stepFighter(s.a, s.b);
      this.stepFighter(s.b, s.a);

      // 勝敗判定
      if (!s.a.alive || !s.b.alive) {
        s.winner = !s.a.alive ? "B" : "A";
      }

      // 時刻を進める
      s.t += this.dt;
    }
    return s;
  }
}
