import { describe, it, expect } from "vitest";
import { cloneState, cloneConfig } from "../log";
import type { BattleState, BattleConfig, FighterState } from "../types";

describe("cloneState", () => {
  const createTestState = (): BattleState => ({
    t: 1.5,
    winner: null,
    a: {
      id: "A",
      pos: { x: 10, y: 20 },
      hp: 80,
      cooldown: 0.3,
      alive: true,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    },
    b: {
      id: "B",
      pos: { x: -10, y: -20 },
      hp: 90,
      cooldown: 0.1,
      alive: true,
      params: {
        hpMax: 100,
        atk: 12,
        range: 35,
        speed: 55,
        cooldown: 0.6,
      },
    },
  });

  it("状態を深くコピーする", () => {
    const original = createTestState();
    const cloned = cloneState(original);

    // 値は同じ
    expect(cloned).toEqual(original);

    // 参照は異なる
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.a.pos).not.toBe(original.a.pos);
    expect(cloned.b.pos).not.toBe(original.b.pos);
    expect(cloned.a.params).not.toBe(original.a.params);
    expect(cloned.b.params).not.toBe(original.b.params);
  });

  it("コピー後の変更が元のオブジェクトに影響しない", () => {
    const original = createTestState();
    const cloned = cloneState(original);

    // クローンを変更
    cloned.t = 999;
    cloned.winner = "A";
    cloned.a.hp = 0;
    cloned.a.pos.x = 999;
    cloned.a.params.atk = 999;

    // 元は変わらない
    expect(original.t).toBe(1.5);
    expect(original.winner).toBeNull();
    expect(original.a.hp).toBe(80);
    expect(original.a.pos.x).toBe(10);
    expect(original.a.params.atk).toBe(10);
  });

  it("勝者がいる状態をコピー", () => {
    const original = createTestState();
    original.winner = "B";
    original.a.alive = false;
    original.a.hp = 0;

    const cloned = cloneState(original);

    expect(cloned.winner).toBe("B");
    expect(cloned.a.alive).toBe(false);
    expect(cloned.a.hp).toBe(0);

    // 参照は異なる
    expect(cloned).not.toBe(original);
  });

  it("すべてのフィールドが正しくコピーされる", () => {
    const original = createTestState();
    const cloned = cloneState(original);

    // トップレベル
    expect(cloned.t).toBe(original.t);
    expect(cloned.winner).toBe(original.winner);

    // Fighter A
    expect(cloned.a.id).toBe(original.a.id);
    expect(cloned.a.pos.x).toBe(original.a.pos.x);
    expect(cloned.a.pos.y).toBe(original.a.pos.y);
    expect(cloned.a.hp).toBe(original.a.hp);
    expect(cloned.a.cooldown).toBe(original.a.cooldown);
    expect(cloned.a.alive).toBe(original.a.alive);
    expect(cloned.a.params.hpMax).toBe(original.a.params.hpMax);
    expect(cloned.a.params.atk).toBe(original.a.params.atk);
    expect(cloned.a.params.range).toBe(original.a.params.range);
    expect(cloned.a.params.speed).toBe(original.a.params.speed);
    expect(cloned.a.params.cooldown).toBe(original.a.params.cooldown);

    // Fighter B
    expect(cloned.b.id).toBe(original.b.id);
    expect(cloned.b.pos.x).toBe(original.b.pos.x);
    expect(cloned.b.pos.y).toBe(original.b.pos.y);
    expect(cloned.b.hp).toBe(original.b.hp);
    expect(cloned.b.cooldown).toBe(original.b.cooldown);
    expect(cloned.b.alive).toBe(original.b.alive);
    expect(cloned.b.params.hpMax).toBe(original.b.params.hpMax);
    expect(cloned.b.params.atk).toBe(original.b.params.atk);
    expect(cloned.b.params.range).toBe(original.b.params.range);
    expect(cloned.b.params.speed).toBe(original.b.params.speed);
    expect(cloned.b.params.cooldown).toBe(original.b.params.cooldown);
  });
});

describe("cloneConfig", () => {
  const createTestConfig = (): BattleConfig => ({
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
      hpMax: 120,
      atk: 12,
      range: 35,
      speed: 55,
      cooldown: 0.6,
    },
  });

  it("設定を深くコピーする", () => {
    const original = createTestConfig();
    const cloned = cloneConfig(original);

    // 値は同じ
    expect(cloned).toEqual(original);

    // 参照は異なる
    expect(cloned).not.toBe(original);
    expect(cloned.fighterA).not.toBe(original.fighterA);
    expect(cloned.fighterB).not.toBe(original.fighterB);
  });

  it("コピー後の変更が元のオブジェクトに影響しない", () => {
    const original = createTestConfig();
    const cloned = cloneConfig(original);

    // クローンを変更
    cloned.seed = 99999;
    cloned.arenaRadius = 500;
    cloned.tickRate = 120;
    cloned.fighterA.atk = 999;
    cloned.fighterB.hpMax = 999;

    // 元は変わらない
    expect(original.seed).toBe(12345);
    expect(original.arenaRadius).toBe(200);
    expect(original.tickRate).toBe(60);
    expect(original.fighterA.atk).toBe(10);
    expect(original.fighterB.hpMax).toBe(120);
  });

  it("すべてのフィールドが正しくコピーされる", () => {
    const original = createTestConfig();
    const cloned = cloneConfig(original);

    // トップレベル
    expect(cloned.seed).toBe(original.seed);
    expect(cloned.arenaRadius).toBe(original.arenaRadius);
    expect(cloned.tickRate).toBe(original.tickRate);

    // Fighter A
    expect(cloned.fighterA.hpMax).toBe(original.fighterA.hpMax);
    expect(cloned.fighterA.atk).toBe(original.fighterA.atk);
    expect(cloned.fighterA.range).toBe(original.fighterA.range);
    expect(cloned.fighterA.speed).toBe(original.fighterA.speed);
    expect(cloned.fighterA.cooldown).toBe(original.fighterA.cooldown);

    // Fighter B
    expect(cloned.fighterB.hpMax).toBe(original.fighterB.hpMax);
    expect(cloned.fighterB.atk).toBe(original.fighterB.atk);
    expect(cloned.fighterB.range).toBe(original.fighterB.range);
    expect(cloned.fighterB.speed).toBe(original.fighterB.speed);
    expect(cloned.fighterB.cooldown).toBe(original.fighterB.cooldown);
  });

  it("非対称な設定もコピーできる", () => {
    const original: BattleConfig = {
      seed: 0,
      arenaRadius: 150,
      tickRate: 30,
      fighterA: {
        hpMax: 50,
        atk: 5,
        range: 20,
        speed: 30,
        cooldown: 0.3,
      },
      fighterB: {
        hpMax: 200,
        atk: 20,
        range: 50,
        speed: 80,
        cooldown: 1.0,
      },
    };

    const cloned = cloneConfig(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });
});

describe("BattleLog type consistency", () => {
  it("BattleLogの型定義が正しい", () => {
    const log = {
      version: 1 as const,
      config: {
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
      },
      frames: [],
    };

    expect(log.version).toBe(1);
    expect(log.config).toBeDefined();
    expect(Array.isArray(log.frames)).toBe(true);
  });
});
