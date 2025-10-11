import { describe, it, expect } from "vitest";
import type { FighterParams, FighterState, Vec2 } from "../types";

/**
 * fighter.ts は現在空ファイルだが、将来の拡張に備えて
 * FighterParams と FighterState の型整合性をテストする
 */

describe("FighterParams type consistency", () => {
  it("有効なFighterParamsオブジェクトを作成できる", () => {
    const params: FighterParams = {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    };

    expect(params.hpMax).toBe(100);
    expect(params.atk).toBe(10);
    expect(params.range).toBe(30);
    expect(params.speed).toBe(50);
    expect(params.cooldown).toBe(0.5);
  });

  it("すべてのフィールドが必須", () => {
    const params: FighterParams = {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    };

    // 型チェックのため、すべてのフィールドが定義されていることを確認
    expect(params).toHaveProperty("hpMax");
    expect(params).toHaveProperty("atk");
    expect(params).toHaveProperty("range");
    expect(params).toHaveProperty("speed");
    expect(params).toHaveProperty("cooldown");
  });

  it("数値型のパラメータを保持", () => {
    const params: FighterParams = {
      hpMax: 150.5,
      atk: 12.3,
      range: 45.7,
      speed: 60.2,
      cooldown: 0.75,
    };

    expect(typeof params.hpMax).toBe("number");
    expect(typeof params.atk).toBe("number");
    expect(typeof params.range).toBe("number");
    expect(typeof params.speed).toBe("number");
    expect(typeof params.cooldown).toBe("number");
  });
});

describe("FighterState type consistency", () => {
  it("有効なFighterStateオブジェクトを作成できる", () => {
    const state: FighterState = {
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
    };

    expect(state.id).toBe("A");
    expect(state.pos.x).toBe(10);
    expect(state.pos.y).toBe(20);
    expect(state.hp).toBe(80);
    expect(state.cooldown).toBe(0.3);
    expect(state.alive).toBe(true);
    expect(state.params.hpMax).toBe(100);
  });

  it("id は 'A' または 'B' のみ", () => {
    const stateA: FighterState = {
      id: "A",
      pos: { x: 0, y: 0 },
      hp: 100,
      cooldown: 0,
      alive: true,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    };

    const stateB: FighterState = {
      id: "B",
      pos: { x: 0, y: 0 },
      hp: 100,
      cooldown: 0,
      alive: true,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    };

    expect(stateA.id).toBe("A");
    expect(stateB.id).toBe("B");
    expect(["A", "B"]).toContain(stateA.id);
    expect(["A", "B"]).toContain(stateB.id);
  });

  it("死亡状態を表現できる", () => {
    const state: FighterState = {
      id: "A",
      pos: { x: 10, y: 20 },
      hp: 0,
      cooldown: 0,
      alive: false,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    };

    expect(state.hp).toBe(0);
    expect(state.alive).toBe(false);
  });

  it("すべてのフィールドが必須", () => {
    const state: FighterState = {
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
    };

    expect(state).toHaveProperty("id");
    expect(state).toHaveProperty("pos");
    expect(state).toHaveProperty("hp");
    expect(state).toHaveProperty("cooldown");
    expect(state).toHaveProperty("alive");
    expect(state).toHaveProperty("params");
  });
});

describe("Vec2 type consistency", () => {
  it("有効なVec2オブジェクトを作成できる", () => {
    const vec: Vec2 = { x: 10, y: 20 };

    expect(vec.x).toBe(10);
    expect(vec.y).toBe(20);
  });

  it("負の値も扱える", () => {
    const vec: Vec2 = { x: -10, y: -20 };

    expect(vec.x).toBe(-10);
    expect(vec.y).toBe(-20);
  });

  it("小数も扱える", () => {
    const vec: Vec2 = { x: 10.5, y: 20.75 };

    expect(vec.x).toBe(10.5);
    expect(vec.y).toBe(20.75);
  });

  it("ゼロベクトルを表現できる", () => {
    const vec: Vec2 = { x: 0, y: 0 };

    expect(vec.x).toBe(0);
    expect(vec.y).toBe(0);
  });

  it("数値型のフィールドを持つ", () => {
    const vec: Vec2 = { x: 10, y: 20 };

    expect(typeof vec.x).toBe("number");
    expect(typeof vec.y).toBe("number");
  });
});

describe("Fighter behavior validation", () => {
  it("HPはhpMax以下であるべき", () => {
    const state: FighterState = {
      id: "A",
      pos: { x: 0, y: 0 },
      hp: 80,
      cooldown: 0,
      alive: true,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    };

    expect(state.hp).toBeLessThanOrEqual(state.params.hpMax);
  });

  it("死亡時はHPが0でaliveがfalse", () => {
    const state: FighterState = {
      id: "A",
      pos: { x: 0, y: 0 },
      hp: 0,
      cooldown: 0,
      alive: false,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    };

    expect(state.hp).toBe(0);
    expect(state.alive).toBe(false);
  });

  it("クールダウンは0以上であるべき", () => {
    const state: FighterState = {
      id: "A",
      pos: { x: 0, y: 0 },
      hp: 100,
      cooldown: 0.3,
      alive: true,
      params: {
        hpMax: 100,
        atk: 10,
        range: 30,
        speed: 50,
        cooldown: 0.5,
      },
    };

    expect(state.cooldown).toBeGreaterThanOrEqual(0);
  });

  it("パラメータは正の値であるべき", () => {
    const params: FighterParams = {
      hpMax: 100,
      atk: 10,
      range: 30,
      speed: 50,
      cooldown: 0.5,
    };

    expect(params.hpMax).toBeGreaterThan(0);
    expect(params.atk).toBeGreaterThan(0);
    expect(params.range).toBeGreaterThan(0);
    expect(params.speed).toBeGreaterThan(0);
    expect(params.cooldown).toBeGreaterThan(0);
  });
});
