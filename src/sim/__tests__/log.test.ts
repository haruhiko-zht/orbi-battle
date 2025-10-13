import { describe, it, expect } from "vitest";
import { cloneState, cloneConfig } from "../log";
import type { BattleState, BattleConfig } from "../types";

describe("cloneState", () => {
  const createTestState = (): BattleState => ({
    t: 1.5,
    winner: null,
    fighters: [
      {
        id: "A-0",
        teamId: "A",
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
      {
        id: "B-0",
        teamId: "B",
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
    ],
  });

  it("状態を深くコピーする", () => {
    const original = createTestState();
    const cloned = cloneState(original);

    // 値は同じ
    expect(cloned).toEqual(original);

    // 参照は異なる
    expect(cloned).not.toBe(original);
    expect(cloned.fighters).not.toBe(original.fighters);
    for (let i = 0; i < cloned.fighters.length; i++) {
      expect(cloned.fighters[i]).not.toBe(original.fighters[i]);
      expect(cloned.fighters[i].pos).not.toBe(original.fighters[i].pos);
      expect(cloned.fighters[i].params).not.toBe(original.fighters[i].params);
    }
  });

  it("コピー後の変更が元のオブジェクトに影響しない", () => {
    const original = createTestState();
    const cloned = cloneState(original);

    // クローンを変更
    cloned.t = 999;
    cloned.winner = "A";
    cloned.fighters[0].hp = 0;
    cloned.fighters[0].pos.x = 999;
    cloned.fighters[0].params.atk = 999;

    // 元は変わらない
    expect(original.t).toBe(1.5);
    expect(original.winner).toBeNull();
    expect(original.fighters[0].hp).toBe(80);
    expect(original.fighters[0].pos.x).toBe(10);
    expect(original.fighters[0].params.atk).toBe(10);
  });

  it("勝者がいる状態をコピー", () => {
    const original = createTestState();
    original.winner = "B";
    original.fighters[0].alive = false;
    original.fighters[0].hp = 0;

    const cloned = cloneState(original);

    expect(cloned.winner).toBe("B");
    expect(cloned.fighters[0].alive).toBe(false);
    expect(cloned.fighters[0].hp).toBe(0);

    // 参照は異なる
    expect(cloned).not.toBe(original);
  });

  it("すべてのフィールドが正しくコピーされる", () => {
    const original = createTestState();
    const cloned = cloneState(original);

    // トップレベル
    expect(cloned.t).toBe(original.t);
    expect(cloned.winner).toBe(original.winner);

    // 全ファイターをチェック
    expect(cloned.fighters.length).toBe(original.fighters.length);
    for (let i = 0; i < original.fighters.length; i++) {
      const origFighter = original.fighters[i];
      const clonedFighter = cloned.fighters[i];

      expect(clonedFighter.id).toBe(origFighter.id);
      expect(clonedFighter.teamId).toBe(origFighter.teamId);
      expect(clonedFighter.pos.x).toBe(origFighter.pos.x);
      expect(clonedFighter.pos.y).toBe(origFighter.pos.y);
      expect(clonedFighter.hp).toBe(origFighter.hp);
      expect(clonedFighter.cooldown).toBe(origFighter.cooldown);
      expect(clonedFighter.alive).toBe(origFighter.alive);
      expect(clonedFighter.params.hpMax).toBe(origFighter.params.hpMax);
      expect(clonedFighter.params.atk).toBe(origFighter.params.atk);
      expect(clonedFighter.params.range).toBe(origFighter.params.range);
      expect(clonedFighter.params.speed).toBe(origFighter.params.speed);
      expect(clonedFighter.params.cooldown).toBe(origFighter.params.cooldown);
    }
  });
});

describe("cloneConfig", () => {
  const createTestConfig = (): BattleConfig => ({
    seed: 12345,
    arenaRadius: 200,
    tickRate: 60,
    teams: [
      {
        id: "A",
        fighters: [
          {
            hpMax: 100,
            atk: 10,
            range: 30,
            speed: 50,
            cooldown: 0.5,
          },
        ],
      },
      {
        id: "B",
        fighters: [
          {
            hpMax: 120,
            atk: 12,
            range: 35,
            speed: 55,
            cooldown: 0.6,
          },
        ],
      },
    ],
  });

  it("設定を深くコピーする", () => {
    const original = createTestConfig();
    const cloned = cloneConfig(original);

    // 値は同じ
    expect(cloned).toEqual(original);

    // 参照は異なる
    expect(cloned).not.toBe(original);
    expect(cloned.teams).not.toBe(original.teams);
    for (let i = 0; i < cloned.teams.length; i++) {
      expect(cloned.teams[i]).not.toBe(original.teams[i]);
      expect(cloned.teams[i].fighters).not.toBe(original.teams[i].fighters);
    }
  });

  it("コピー後の変更が元のオブジェクトに影響しない", () => {
    const original = createTestConfig();
    const cloned = cloneConfig(original);

    // クローンを変更
    cloned.seed = 99999;
    cloned.arenaRadius = 500;
    cloned.tickRate = 120;
    cloned.teams[0].fighters[0].atk = 999;
    cloned.teams[1].fighters[0].hpMax = 999;

    // 元は変わらない
    expect(original.seed).toBe(12345);
    expect(original.arenaRadius).toBe(200);
    expect(original.tickRate).toBe(60);
    expect(original.teams[0].fighters[0].atk).toBe(10);
    expect(original.teams[1].fighters[0].hpMax).toBe(120);
  });

  it("すべてのフィールドが正しくコピーされる", () => {
    const original = createTestConfig();
    const cloned = cloneConfig(original);

    // トップレベル
    expect(cloned.seed).toBe(original.seed);
    expect(cloned.arenaRadius).toBe(original.arenaRadius);
    expect(cloned.tickRate).toBe(original.tickRate);

    // 全チームと全ファイターをチェック
    expect(cloned.teams.length).toBe(original.teams.length);
    for (let i = 0; i < original.teams.length; i++) {
      expect(cloned.teams[i].id).toBe(original.teams[i].id);
      expect(cloned.teams[i].fighters.length).toBe(
        original.teams[i].fighters.length
      );

      for (let j = 0; j < original.teams[i].fighters.length; j++) {
        const origFighter = original.teams[i].fighters[j];
        const clonedFighter = cloned.teams[i].fighters[j];

        expect(clonedFighter.hpMax).toBe(origFighter.hpMax);
        expect(clonedFighter.atk).toBe(origFighter.atk);
        expect(clonedFighter.range).toBe(origFighter.range);
        expect(clonedFighter.speed).toBe(origFighter.speed);
        expect(clonedFighter.cooldown).toBe(origFighter.cooldown);
      }
    }
  });

  it("非対称な設定もコピーできる", () => {
    const original: BattleConfig = {
      seed: 0,
      arenaRadius: 150,
      tickRate: 30,
      teams: [
        {
          id: "A",
          fighters: [
            {
              hpMax: 50,
              atk: 5,
              range: 20,
              speed: 30,
              cooldown: 0.3,
            },
          ],
        },
        {
          id: "B",
          fighters: [
            {
              hpMax: 200,
              atk: 20,
              range: 50,
              speed: 80,
              cooldown: 1.0,
            },
          ],
        },
      ],
    };

    const cloned = cloneConfig(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });
});

describe("BattleLog type consistency", () => {
  it("BattleLogの型定義が正しい", () => {
    const log = {
      version: 2 as const,
      config: {
        seed: 12345,
        arenaRadius: 200,
        tickRate: 60,
        teams: [
          {
            id: "A",
            fighters: [
              {
                hpMax: 100,
                atk: 10,
                range: 30,
                speed: 50,
                cooldown: 0.5,
              },
            ],
          },
          {
            id: "B",
            fighters: [
              {
                hpMax: 100,
                atk: 10,
                range: 30,
                speed: 50,
                cooldown: 0.5,
              },
            ],
          },
        ],
      },
      frames: [],
    };

    expect(log.version).toBe(2);
    expect(log.config).toBeDefined();
    expect(Array.isArray(log.frames)).toBe(true);
  });
});
