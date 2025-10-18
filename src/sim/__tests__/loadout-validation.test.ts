import { describe, it, expect } from "vitest";
import { validateBattleConfig } from "../validation";
import { resolveBehaviorForParams } from "../behaviors/resolver";
import type { BattleConfig, FighterParams } from "../types";

const BASE_FIGHTER: FighterParams = {
  hpMax: 100,
  atk: 10,
  range: 40,
  speed: 80,
  cooldown: 0.5,
};

function createFighter(overrides: Partial<FighterParams> = {}): FighterParams {
  return {
    ...BASE_FIGHTER,
    ...overrides,
  };
}

function createConfig(overrides: Partial<FighterParams>): BattleConfig {
  return {
    seed: 12345,
    arenaRadius: 200,
    tickRate: 60,
    teams: [
      { id: "A", fighters: [createFighter(overrides)] },
      { id: "B", fighters: [createFighter()] },
    ],
  };
}

describe("loadout validation", () => {
  it("ジョブと装備の補正がステータスに反映される", () => {
    const fighter = createFighter({
      jobId: "job.warrior",
      equipment: {
        weapon: "equip.weapon.basic",
        shoes: "equip.shoes.runner",
      },
    });

    const { params } = resolveBehaviorForParams(fighter);

    expect(params.hpMax).toBe(120); // +20 (warrior)
    expect(params.atk).toBe(15); // +3 (warrior) +2 (weapon)
    expect(params.speed).toBe(90); // +10 (shoes)
    expect(fighter.hpMax).toBe(100);
  });

  it("未知の jobId で validateBattleConfig が例外", () => {
    const cfg = createConfig({ jobId: "job.unknown" });
    expect(() => validateBattleConfig(cfg)).toThrow(/未登録の職業ID/);
  });

  it("未知の装備ID で validateBattleConfig が例外", () => {
    const cfg = createConfig({
      equipment: {
        weapon: "equip.unknown",
      },
    });
    expect(() => validateBattleConfig(cfg)).toThrow(/未登録の装備ID/);
  });

  it("装備スロット不一致を validateBattleConfig が検出する", () => {
    const cfg = createConfig({
      equipment: {
        head: "equip.weapon.basic",
      },
    });
    expect(() => validateBattleConfig(cfg)).toThrow(/装備スロットが一致しません/);
  });

  it("未知の jobId で resolveBehaviorForParams が例外", () => {
    const fighter = createFighter({ jobId: "job.invalid" });
    expect(() => resolveBehaviorForParams(fighter)).toThrow(/未登録のジョブID/);
  });

  it("未知の装備ID で resolveBehaviorForParams が例外", () => {
    const fighter = createFighter({
      equipment: {
        weapon: "equip.invalid",
      },
    });
    expect(() => resolveBehaviorForParams(fighter)).toThrow(/未登録の装備ID/);
  });

  it("装備スロット不一致で resolveBehaviorForParams が例外", () => {
    const fighter = createFighter({
      equipment: {
        head: "equip.weapon.basic",
      },
    });
    expect(() => resolveBehaviorForParams(fighter)).toThrow(/装備スロットが一致しません/);
  });
});
