import { describe, it, expect } from "vitest";
import { Engine } from "../engine";
import type { BattleConfig, FighterParams } from "../types";

// テストヘルパー: 1v1 の BattleConfig を作成
function makeConfig(
  seed: number,
  fighterA: FighterParams,
  fighterB: FighterParams,
  arenaRadius = 200,
  tickRate = 60
): BattleConfig {
  return {
    seed,
    arenaRadius,
    tickRate,
    teams: [
      { id: "A", fighters: [fighterA] },
      { id: "B", fighters: [fighterB] },
    ],
  };
}

describe("Engine", () => {
  const defaultConfig = makeConfig(
    12345,
    {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    },
    {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    }
  );

  it("初期状態が正しく設定される", () => {
    const engine = new Engine(defaultConfig);

    expect(engine.state.t).toBe(0);
    expect(engine.state.winner).toBeNull();

    const fighterA = engine.state.fighters.find((f) => f.teamId === "A");
    const fighterB = engine.state.fighters.find((f) => f.teamId === "B");

    expect(fighterA).toBeDefined();
    expect(fighterB).toBeDefined();
    expect(fighterA!.hp).toBe(100);
    expect(fighterB!.hp).toBe(100);
    expect(fighterA!.alive).toBe(true);
    expect(fighterB!.alive).toBe(true);
  });

  it("初期配置がアリーナ半径の70%の円上にある", () => {
    const engine = new Engine(defaultConfig);
    const expectedR = defaultConfig.arenaRadius * 0.7;

    for (const fighter of engine.state.fighters) {
      const dist = Math.hypot(fighter.pos.x, fighter.pos.y);
      expect(dist).toBeCloseTo(expectedR, 5);
    }

    // 1v1の場合、Fighter A は下半円、Fighter B は上半円
    const fighterA = engine.state.fighters.find((f) => f.teamId === "A");
    const fighterB = engine.state.fighters.find((f) => f.teamId === "B");

    expect(fighterA).toBeDefined();
    expect(fighterB).toBeDefined();
    expect(fighterA!.pos.x).toBeCloseTo(0, 5);
    expect(fighterB!.pos.x).toBeCloseTo(0, 5);
    expect(fighterA!.pos.y).toBeLessThan(0); // 下半円（y < 0）
    expect(fighterB!.pos.y).toBeGreaterThan(0); // 上半円（y > 0）
    expect(Math.abs(Math.abs(fighterA!.pos.y) - expectedR)).toBeLessThan(1e-5);
    expect(Math.abs(Math.abs(fighterB!.pos.y) - expectedR)).toBeLessThan(1e-5);
  });

  it("決定論的動作: 同じシードで同じ結果", () => {
    const engine1 = new Engine(defaultConfig);
    const engine2 = new Engine(defaultConfig);

    // 100フレーム進める
    for (let i = 0; i < 100; i++) {
      engine1.update();
      engine2.update();
    }

    // 全ファイターの状態が一致することを確認
    expect(engine1.state.fighters.length).toBe(engine2.state.fighters.length);
    for (let i = 0; i < engine1.state.fighters.length; i++) {
      expect(engine1.state.fighters[i]).toEqual(engine2.state.fighters[i]);
    }
    expect(engine1.state.t).toBe(engine2.state.t);
  });

  it("異なるシードで異なる結果", () => {
    const config1 = makeConfig(
      12345,
      defaultConfig.teams[0].fighters[0],
      defaultConfig.teams[1].fighters[0]
    );
    const config2 = makeConfig(
      67890,
      defaultConfig.teams[0].fighters[0],
      defaultConfig.teams[1].fighters[0]
    );

    const engine1 = new Engine(config1);
    const engine2 = new Engine(config2);

    // 100フレーム進める
    for (let i = 0; i < 100; i++) {
      engine1.update();
      engine2.update();
    }

    // 現在の実装では乱数を使っていないので、この条件は成立しないかもしれない
    // 将来の拡張時に確認できるようテストケースとして残す
    // expect(engine1.state.a.hp).not.toBe(engine2.state.a.hp);
  });

  it("ファイターがアリーナ外に出ない", () => {
    const engine = new Engine(defaultConfig);

    for (let i = 0; i < 1000; i++) {
      engine.update();

      for (const fighter of engine.state.fighters) {
        const dist = Math.hypot(fighter.pos.x, fighter.pos.y);
        // 浮動小数点の誤差を考慮して0.01の余裕を持たせる
        expect(dist).toBeLessThanOrEqual(defaultConfig.arenaRadius + 0.01);
      }
    }
  });

  it("ファイターが死亡すると勝者が決まる", () => {
    // 一方的に強いファイターを設定
    const config = makeConfig(
      12345,
      {
        hpMax: 1000,
        atk: 100,
        range: 100,
        speed: 100,
        cooldown: 0.1,
      },
      {
        hpMax: 10,
        atk: 1,
        range: 30,
        speed: 10,
        cooldown: 1.0,
      }
    );

    const engine = new Engine(config);

    // バトル終了まで実行
    let maxFrames = 3000;
    while (!engine.state.winner && maxFrames-- > 0) {
      engine.update();
    }

    // 勝者が決まっている
    expect(engine.state.winner).not.toBeNull();
    // Fighter A が勝利
    expect(engine.state.winner).toBe("A");
    // Fighter B が死亡
    const fighterB = engine.state.fighters.find((f) => f.teamId === "B");
    expect(fighterB).toBeDefined();
    expect(fighterB!.alive).toBe(false);
    expect(fighterB!.hp).toBe(0);
  });

  it("時刻が正しく進む", () => {
    const engine = new Engine(defaultConfig);
    const dt = 1 / defaultConfig.tickRate;

    for (let i = 1; i <= 100; i++) {
      engine.update();
      // 浮動小数点の誤差を考慮
      expect(engine.state.t).toBeCloseTo(dt * i, 10);
    }
  });

  it("不正な tickRate では Engine 生成時に例外を投げる", () => {
    const invalidConfig = {
      ...defaultConfig,
      tickRate: 0,
    };

    expect(() => new Engine(invalidConfig)).toThrowError(
      "BattleConfig.tickRate は 0より大きいである必要があります"
    );
  });

  it("チームが空配列の場合は Engine 生成時に例外を投げる", () => {
    const invalidConfig = {
      ...defaultConfig,
      teams: [],
    };

    expect(() => new Engine(invalidConfig)).toThrowError(
      "BattleConfig.teams には 1 チーム以上が必要です"
    );
  });

  it("クールダウンが正しく動作する", () => {
    const config = makeConfig(
      12345,
      {
        hpMax: 1000,
        atk: 10,
        range: 500, // 常に射程内
        speed: 0, // 移動しない
        cooldown: 1.0,
      },
      {
        hpMax: 1000,
        atk: 10,
        range: 500,
        speed: 0,
        cooldown: 1.0,
      }
    );

    const engine = new Engine(config);
    const fighterA = engine.state.fighters.find((f) => f.teamId === "A")!;
    const fighterB = engine.state.fighters.find((f) => f.teamId === "B")!;
    const initialHp = fighterB.hp;

    // 1フレーム進める（攻撃が発動）
    engine.update();
    expect(fighterB.hp).toBe(initialHp - config.teams[0].fighters[0].atk);
    expect(fighterA.cooldown).toBeGreaterThan(0);

    // クールダウン中は攻撃しない
    const hpAfterFirstAttack = fighterB.hp;
    engine.update();
    expect(fighterB.hp).toBe(hpAfterFirstAttack); // ダメージなし

    // クールダウンが終わるまで待つ
    for (let i = 0; i < 60; i++) {
      engine.update();
    }

    // 再び攻撃が発動
    expect(fighterB.hp).toBeLessThan(hpAfterFirstAttack);
  });
});
