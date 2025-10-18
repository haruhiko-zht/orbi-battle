import { describe, it, expect } from "vitest";
import { NearestTargetTactic } from "../nearestTarget";
import { AggressiveTactic } from "../aggressive";
import { DefensiveTactic } from "../defensive";
import { getTactic } from "../index";
import type { FighterState } from "../../types";

/**
 * テスト用のファイター状態を作成
 */
function createFighter(
  id: string,
  teamId: string,
  x: number,
  y: number,
  range = 100,
  speed = 50
): FighterState {
  return {
    id,
    teamId,
    pos: { x, y },
    hp: 100,
    cooldown: 0,
    alive: true,
    params: {
      hpMax: 100,
      atk: 10,
      range,
      speed,
      cooldown: 1,
      tacticId: "nearest",
    },
  };
}

describe("NearestTargetTactic", () => {
  const tactic = new NearestTargetTactic();

  it("敵がいない場合は何もしない", () => {
    const self = createFighter("A-0", "A", 0, 0);
    const decision = tactic.decide(self, [], 300);
    expect(decision.targetId).toBeNull();
    expect(decision.moveDirection).toBeNull();
  });

  it("射程外の敵に向かって移動する", () => {
    const self = createFighter("A-0", "A", 0, 0, 50);
    const enemy = createFighter("B-0", "B", 100, 0);
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).not.toBeNull();
    expect(decision.moveDirection!.x).toBeCloseTo(1, 5);
    expect(decision.moveDirection!.y).toBeCloseTo(0, 5);
  });

  it("射程内の敵に対しては移動せず攻撃", () => {
    const self = createFighter("A-0", "A", 0, 0, 100);
    const enemy = createFighter("B-0", "B", 50, 0);
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).toBeNull(); // 射程内なので移動しない
  });

  it("複数の敵がいる場合は最も近い敵を選択", () => {
    const self = createFighter("A-0", "A", 0, 0);
    const farEnemy = createFighter("B-0", "B", 200, 0);
    const nearEnemy = createFighter("B-1", "B", 50, 0);
    const decision = tactic.decide(self, [farEnemy, nearEnemy], 300);

    expect(decision.targetId).toBe("B-1"); // 近い方を選択
  });
});

describe("AggressiveTactic", () => {
  const tactic = new AggressiveTactic();

  it("敵がいない場合は何もしない", () => {
    const self = createFighter("A-0", "A", 0, 0);
    const decision = tactic.decide(self, [], 300);
    expect(decision.targetId).toBeNull();
    expect(decision.moveDirection).toBeNull();
  });

  it("射程外の敵に向かって移動する", () => {
    const self = createFighter("A-0", "A", 0, 0, 50);
    const enemy = createFighter("B-0", "B", 100, 0);
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).not.toBeNull();
  });

  it("射程内でも接近し続ける（密着戦闘）", () => {
    const self = createFighter("A-0", "A", 0, 0, 100);
    const enemy = createFighter("B-0", "B", 50, 0);
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).not.toBeNull(); // 射程内でも移動する
    expect(decision.moveDirection!.x).toBeCloseTo(1, 5);
  });
});

describe("DefensiveTactic", () => {
  const tactic = new DefensiveTactic();

  it("敵がいない場合は何もしない", () => {
    const self = createFighter("A-0", "A", 0, 0);
    const decision = tactic.decide(self, [], 300);
    expect(decision.targetId).toBeNull();
    expect(decision.moveDirection).toBeNull();
  });

  it("敵が近すぎる場合は距離を取る", () => {
    const self = createFighter("A-0", "A", 0, 0, 100);
    const enemy = createFighter("B-0", "B", 50, 0); // 射程100の50%位置
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).not.toBeNull();
    expect(decision.moveDirection!.x).toBeCloseTo(-1, 5); // 逃げる方向
  });

  it("適切な距離（射程80%〜100%）では停止", () => {
    const self = createFighter("A-0", "A", 0, 0, 100);
    const enemy = createFighter("B-0", "B", 90, 0); // 射程100の90%位置
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).toBeNull(); // 適切な距離なので停止
  });

  it("射程外なら接近する", () => {
    const self = createFighter("A-0", "A", 0, 0, 100);
    const enemy = createFighter("B-0", "B", 150, 0);
    const decision = tactic.decide(self, [enemy], 300);

    expect(decision.targetId).toBe("B-0");
    expect(decision.moveDirection).not.toBeNull();
    expect(decision.moveDirection!.x).toBeCloseTo(1, 5); // 接近
  });
});

describe("getTactic", () => {
  it("nearest ID で NearestTargetTactic を取得", () => {
    const tactic = getTactic("nearest");
    expect(tactic).toBeInstanceOf(NearestTargetTactic);
  });

  it("aggressive ID で AggressiveTactic を取得", () => {
    const tactic = getTactic("aggressive");
    expect(tactic).toBeInstanceOf(AggressiveTactic);
  });

  it("defensive ID で DefensiveTactic を取得", () => {
    const tactic = getTactic("defensive");
    expect(tactic).toBeInstanceOf(DefensiveTactic);
  });

  it("同じタイプを複数回取得してもシングルトン", () => {
    const tactic1 = getTactic("nearest");
    const tactic2 = getTactic("nearest");
    expect(tactic1).toBe(tactic2); // 同じインスタンス
  });
});
