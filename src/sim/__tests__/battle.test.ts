import { describe, it, expect } from "vitest";
import { simulateBattle, BattleSim } from "../battle";
import type { BattleConfig, FighterParams } from "../types";

// テストヘルパー: 1v1 の BattleConfig を作成
function makeConfig(
  seed: number,
  fighterA: FighterParams,
  fighterB: FighterParams,
  arenaRadius = 220,
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

describe("simulateBattle", () => {
  const defaultConfig = makeConfig(
    99999,
    {
      hpMax: 120,
      atk: 10,
      range: 36,
      speed: 75,
      cooldown: 0.45,
    },
    {
      hpMax: 120,
      atk: 10,
      range: 36,
      speed: 75,
      cooldown: 0.45,
    }
  );

  it("バトルログが正しく生成される", () => {
    const log = simulateBattle(defaultConfig);

    expect(log.version).toBe(2);
    expect(log.config).toEqual(defaultConfig);
    expect(log.frames.length).toBeGreaterThan(0);
    expect(log.frames[0].t).toBe(0);
  });

  it("最初のフレームは初期状態", () => {
    const log = simulateBattle(defaultConfig);
    const firstFrame = log.frames[0];

    expect(firstFrame.t).toBe(0);
    expect(firstFrame.winner).toBeNull();

    const fighterA = firstFrame.fighters.find((f) => f.teamId === "A");
    const fighterB = firstFrame.fighters.find((f) => f.teamId === "B");

    expect(fighterA).toBeDefined();
    expect(fighterB).toBeDefined();
    expect(fighterA!.hp).toBe(defaultConfig.teams[0].fighters[0].hpMax);
    expect(fighterB!.hp).toBe(defaultConfig.teams[1].fighters[0].hpMax);
    expect(fighterA!.alive).toBe(true);
    expect(fighterB!.alive).toBe(true);
  });

  it("勝者が決まる", () => {
    const log = simulateBattle(defaultConfig, { maxSeconds: 30 });
    const lastFrame = log.frames[log.frames.length - 1];

    // 30秒以内に決着がつく想定
    expect(lastFrame.winner).not.toBeNull();
    expect(lastFrame.winner).toMatch(/^[AB]$/);
  });

  it("勝者が決まったら片方のチームが全滅している", () => {
    const log = simulateBattle(defaultConfig, { maxSeconds: 30 });
    const lastFrame = log.frames[log.frames.length - 1];

    if (lastFrame.winner === "A") {
      const teamA = lastFrame.fighters.filter((f) => f.teamId === "A");
      const teamB = lastFrame.fighters.filter((f) => f.teamId === "B");
      expect(teamA.some((f) => f.alive)).toBe(true);
      expect(teamB.every((f) => !f.alive)).toBe(true);
      expect(teamB.every((f) => f.hp === 0)).toBe(true);
    } else if (lastFrame.winner === "B") {
      const teamA = lastFrame.fighters.filter((f) => f.teamId === "A");
      const teamB = lastFrame.fighters.filter((f) => f.teamId === "B");
      expect(teamB.some((f) => f.alive)).toBe(true);
      expect(teamA.every((f) => !f.alive)).toBe(true);
      expect(teamA.every((f) => f.hp === 0)).toBe(true);
    }
  });

  it("maxSecondsオプションでシミュレーション時間を制限", () => {
    const maxSeconds = 5;
    const log = simulateBattle(defaultConfig, { maxSeconds });

    // 最大フレーム数は tickRate * maxSeconds + 1 (初期フレーム)
    const maxFrames = defaultConfig.tickRate * maxSeconds + 1;
    expect(log.frames.length).toBeLessThanOrEqual(maxFrames);

    // 最終フレームの時刻は maxSeconds 以下
    const lastFrame = log.frames[log.frames.length - 1];
    expect(lastFrame.t).toBeLessThanOrEqual(maxSeconds);
  });

  it("時刻が単調増加する", () => {
    const log = simulateBattle(defaultConfig, { maxSeconds: 10 });

    for (let i = 1; i < log.frames.length; i++) {
      expect(log.frames[i].t).toBeGreaterThan(log.frames[i - 1].t);
    }
  });

  it("決定論的動作: 同じ設定で同じログ", () => {
    const log1 = simulateBattle(defaultConfig, { maxSeconds: 5 });
    const log2 = simulateBattle(defaultConfig, { maxSeconds: 5 });

    expect(log1.frames.length).toBe(log2.frames.length);

    // 全フレームが一致することを確認
    for (let i = 0; i < log1.frames.length; i++) {
      expect(log1.frames[i]).toEqual(log2.frames[i]);
    }
  });

  it("非対称な設定で強い方が勝つ", () => {
    const asymmetricConfig = makeConfig(
      12345,
      {
        hpMax: 1000,
        atk: 100,
        range: 100,
        speed: 100,
        cooldown: 0.1,
      },
      {
        hpMax: 50,
        atk: 1,
        range: 30,
        speed: 10,
        cooldown: 1.0,
      },
      200
    );

    const log = simulateBattle(asymmetricConfig, { maxSeconds: 30 });
    const lastFrame = log.frames[log.frames.length - 1];

    // Fighter A が圧倒的に強いので勝利するはず
    expect(lastFrame.winner).toBe("A");
  });

  it("ログの一貫性（スナップショット）", () => {
    const log = simulateBattle(defaultConfig, { maxSeconds: 5 });
    const lastFrame = log.frames[log.frames.length - 1];

    // 最終フレームをスナップショット
    // 初回実行時にスナップショットが作成され、以降は比較される
    expect(lastFrame).toMatchSnapshot();
  });

  it("フレーム数が正しい（勝者が決まった場合）", () => {
    const config = makeConfig(
      12345,
      {
        hpMax: 100,
        atk: 50,
        range: 100,
        speed: 100,
        cooldown: 0.1,
      },
      {
        hpMax: 100,
        atk: 50,
        range: 100,
        speed: 100,
        cooldown: 0.1,
      },
      200
    );

    const log = simulateBattle(config, { maxSeconds: 30 });

    // 勝者が決まっているはず
    expect(log.frames[log.frames.length - 1].winner).not.toBeNull();

    // フレーム数は最大フレーム数以下
    const maxFrames = config.tickRate * 30 + 1;
    expect(log.frames.length).toBeLessThanOrEqual(maxFrames);
  });

  it("tickRate が 0 以下の場合は例外を投げる", () => {
    const invalidConfig = {
      ...defaultConfig,
      tickRate: 0,
    };

    expect(() => simulateBattle(invalidConfig)).toThrowError(
      "BattleConfig.tickRate は 0より大きいである必要があります"
    );
  });

  it("arenaRadius が負の場合は例外を投げる", () => {
    const invalidConfig = {
      ...defaultConfig,
      arenaRadius: -1,
    };

    expect(() => simulateBattle(invalidConfig)).toThrowError(
      "BattleConfig.arenaRadius は 0より大きいである必要があります"
    );
  });

  it("maxSeconds オプションが 0 以下の場合は例外を投げる", () => {
    expect(() => simulateBattle(defaultConfig, { maxSeconds: 0 })).toThrowError(
      "simulateBattle(opts).maxSeconds は 0より大きいである必要があります"
    );
  });
});

describe("BattleSim", () => {
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
    },
    200
  );

  it("コンストラクタでシミュレーションが実行される", () => {
    const sim = new BattleSim(defaultConfig);

    expect(sim).toBeDefined();
    const log = sim.getLog();
    expect(log.version).toBe(2);
    expect(log.frames.length).toBeGreaterThan(0);
  });

  it("getLog()でバトルログを取得できる", () => {
    const sim = new BattleSim(defaultConfig);
    const log = sim.getLog();

    expect(log.version).toBe(2);
    expect(log.config).toEqual(defaultConfig);
    expect(log.frames).toBeDefined();
    expect(Array.isArray(log.frames)).toBe(true);
  });

  it("fixedUpdate()で時間が進む", () => {
    const sim = new BattleSim(defaultConfig);

    // 初期状態
    const state1 = sim.fixedUpdate(0);
    expect(state1.t).toBe(0);

    // 1フレーム分（1/60秒）進める
    const dt = 1 / defaultConfig.tickRate;
    const state2 = sim.fixedUpdate(dt);

    expect(state2.t).toBeGreaterThan(state1.t);
  });

  it("fixedUpdate()で複数フレーム進める", () => {
    const sim = new BattleSim(defaultConfig);

    // 10フレーム分進める
    const dt = 1 / defaultConfig.tickRate;
    for (let i = 0; i < 10; i++) {
      sim.fixedUpdate(dt);
    }

    const state = sim.fixedUpdate(0);
    expect(state.t).toBeGreaterThan(0);
  });

  it("fixedUpdate()で時間蓄積が機能する", () => {
    const sim = new BattleSim(defaultConfig);

    // 半フレーム分を2回渡すと1フレーム進む
    const halfDt = 1 / (defaultConfig.tickRate * 2);

    sim.fixedUpdate(halfDt); // 0.5フレーム蓄積
    const state1 = sim.fixedUpdate(0); // まだ進まない
    expect(state1.t).toBe(0);

    sim.fixedUpdate(halfDt); // 1.0フレーム蓄積
    const state2 = sim.fixedUpdate(0); // 1フレーム進む
    expect(state2.t).toBeGreaterThan(0);
  });

  it("バトル終了後はrunningがfalseになる", () => {
    const quickConfig = makeConfig(
      12345,
      {
        hpMax: 10,
        atk: 100,
        range: 500,
        speed: 100,
        cooldown: 0.1,
      },
      {
        hpMax: 10,
        atk: 1,
        range: 30,
        speed: 10,
        cooldown: 1.0,
      },
      200
    );

    const sim = new BattleSim(quickConfig);
    const dt = 1 / quickConfig.tickRate;

    // バトル終了まで進める
    for (let i = 0; i < 1000; i++) {
      sim.fixedUpdate(dt);
      if (!sim.running) break;
    }

    expect(sim.running).toBe(false);
  });

  it("バトル終了後はfixedUpdate()で時間が進まない", () => {
    const quickConfig = makeConfig(
      12345,
      {
        hpMax: 10,
        atk: 100,
        range: 500,
        speed: 100,
        cooldown: 0.1,
      },
      {
        hpMax: 10,
        atk: 1,
        range: 30,
        speed: 10,
        cooldown: 1.0,
      },
      200
    );

    const sim = new BattleSim(quickConfig);
    const dt = 1 / quickConfig.tickRate;

    // バトル終了まで進める
    for (let i = 0; i < 1000; i++) {
      sim.fixedUpdate(dt);
      if (!sim.running) break;
    }

    const finalState = sim.fixedUpdate(0);
    const finalTime = finalState.t;

    // さらに進めても時間が変わらない
    sim.fixedUpdate(dt);
    const state = sim.fixedUpdate(0);
    expect(state.t).toBe(finalTime);
  });

  it("reset()で新しい設定でバトルをリセットできる", () => {
    const sim = new BattleSim(defaultConfig);
    const dt = 1 / defaultConfig.tickRate;

    // 少し進める
    for (let i = 0; i < 10; i++) {
      sim.fixedUpdate(dt);
    }

    const stateBeforeReset = sim.fixedUpdate(0);
    expect(stateBeforeReset.t).toBeGreaterThan(0);

    // リセット
    const newConfig = makeConfig(
      99999,
      defaultConfig.teams[0].fighters[0],
      defaultConfig.teams[1].fighters[0],
      defaultConfig.arenaRadius,
      defaultConfig.tickRate
    );
    sim.reset(newConfig);

    // 初期状態に戻る
    const stateAfterReset = sim.fixedUpdate(0);
    expect(stateAfterReset.t).toBe(0);
    expect(sim.running).toBe(true);
  });

  it("reset()後のログは新しい設定に基づく", () => {
    const sim = new BattleSim(defaultConfig);

    const newConfig = makeConfig(
      99999,
      defaultConfig.teams[0].fighters[0],
      defaultConfig.teams[1].fighters[0],
      300,
      defaultConfig.tickRate
    );
    sim.reset(newConfig);

    const log = sim.getLog();
    expect(log.config.seed).toBe(99999);
    expect(log.config.arenaRadius).toBe(300);
  });

  it("reset()で時間蓄積もリセットされる", () => {
    const sim = new BattleSim(defaultConfig);

    // 半フレーム分蓄積
    const halfDt = 1 / (defaultConfig.tickRate * 2);
    sim.fixedUpdate(halfDt);

    // リセット
    sim.reset(defaultConfig);

    // 蓄積がリセットされているので、半フレームではまだ進まない
    sim.fixedUpdate(halfDt);
    const state = sim.fixedUpdate(0);
    expect(state.t).toBe(0);
  });

  it("複数のBattleSimインスタンスは独立して動作する", () => {
    const sim1 = new BattleSim(defaultConfig);
    const sim2 = new BattleSim(defaultConfig);

    const dt = 1 / defaultConfig.tickRate;

    // sim1を5フレーム進める
    for (let i = 0; i < 5; i++) {
      sim1.fixedUpdate(dt);
    }

    // sim2を10フレーム進める
    for (let i = 0; i < 10; i++) {
      sim2.fixedUpdate(dt);
    }

    const state1 = sim1.fixedUpdate(0);
    const state2 = sim2.fixedUpdate(0);

    // 進んだ時間が異なる
    expect(state2.t).toBeGreaterThan(state1.t);
  });
});
