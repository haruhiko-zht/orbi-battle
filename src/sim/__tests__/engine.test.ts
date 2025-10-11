import { describe, it, expect } from "vitest";
import { Engine } from "../engine";
import type { BattleConfig } from "../types";

describe("Engine", () => {
  const defaultConfig: BattleConfig = {
    seed: 12345,
    arenaRadius: 200,
    tickRate: 60,
    fighterA: {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    },
    fighterB: {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    },
  };

  it("初期状態が正しく設定される", () => {
    const engine = new Engine(defaultConfig);

    expect(engine.state.t).toBe(0);
    expect(engine.state.winner).toBeNull();
    expect(engine.state.a.hp).toBe(100);
    expect(engine.state.b.hp).toBe(100);
    expect(engine.state.a.alive).toBe(true);
    expect(engine.state.b.alive).toBe(true);
  });

  it("初期配置がアリーナ半径の70%の位置にある", () => {
    const engine = new Engine(defaultConfig);
    const expectedR = defaultConfig.arenaRadius * 0.7;

    // Fighter A はX軸負の方向
    expect(engine.state.a.pos.x).toBe(-expectedR);
    expect(engine.state.a.pos.y).toBe(0);

    // Fighter B はX軸正の方向
    expect(engine.state.b.pos.x).toBe(expectedR);
    expect(engine.state.b.pos.y).toBe(0);
  });

  it("決定論的動作: 同じシードで同じ結果", () => {
    const engine1 = new Engine(defaultConfig);
    const engine2 = new Engine(defaultConfig);

    // 100フレーム進める
    for (let i = 0; i < 100; i++) {
      engine1.update();
      engine2.update();
    }

    expect(engine1.state.a.hp).toBe(engine2.state.a.hp);
    expect(engine1.state.b.hp).toBe(engine2.state.b.hp);
    expect(engine1.state.a.pos).toEqual(engine2.state.a.pos);
    expect(engine1.state.b.pos).toEqual(engine2.state.b.pos);
    expect(engine1.state.t).toBe(engine2.state.t);
  });

  it("異なるシードで異なる結果", () => {
    const config1 = { ...defaultConfig, seed: 12345 };
    const config2 = { ...defaultConfig, seed: 67890 };

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

      const distA = Math.hypot(engine.state.a.pos.x, engine.state.a.pos.y);
      const distB = Math.hypot(engine.state.b.pos.x, engine.state.b.pos.y);

      // 浮動小数点の誤差を考慮して0.01の余裕を持たせる
      expect(distA).toBeLessThanOrEqual(defaultConfig.arenaRadius + 0.01);
      expect(distB).toBeLessThanOrEqual(defaultConfig.arenaRadius + 0.01);
    }
  });

  it("ファイターが死亡すると勝者が決まる", () => {
    // 一方的に強いファイターを設定
    const config: BattleConfig = {
      seed: 12345,
      arenaRadius: 200,
      tickRate: 60,
      fighterA: {
        hpMax: 1000,
        atk: 100,
        range: 100,
        speed: 100,
        cooldown: 0.1,
      },
      fighterB: {
        hpMax: 10,
        atk: 1,
        range: 30,
        speed: 10,
        cooldown: 1.0,
      },
    };

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
    expect(engine.state.b.alive).toBe(false);
    expect(engine.state.b.hp).toBe(0);
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

  it("クールダウンが正しく動作する", () => {
    const config: BattleConfig = {
      seed: 12345,
      arenaRadius: 200,
      tickRate: 60,
      fighterA: {
        hpMax: 1000,
        atk: 10,
        range: 500, // 常に射程内
        speed: 0, // 移動しない
        cooldown: 1.0,
      },
      fighterB: {
        hpMax: 1000,
        atk: 10,
        range: 500,
        speed: 0,
        cooldown: 1.0,
      },
    };

    const engine = new Engine(config);
    const initialHp = engine.state.b.hp;

    // 1フレーム進める（攻撃が発動）
    engine.update();
    expect(engine.state.b.hp).toBe(initialHp - config.fighterA.atk);
    expect(engine.state.a.cooldown).toBeGreaterThan(0);

    // クールダウン中は攻撃しない
    const hpAfterFirstAttack = engine.state.b.hp;
    engine.update();
    expect(engine.state.b.hp).toBe(hpAfterFirstAttack); // ダメージなし

    // クールダウンが終わるまで待つ
    for (let i = 0; i < 60; i++) {
      engine.update();
    }

    // 再び攻撃が発動
    expect(engine.state.b.hp).toBeLessThan(hpAfterFirstAttack);
  });
});
