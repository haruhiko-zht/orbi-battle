import { describe, it, expect } from "vitest";
import { simulateBattle } from "../battle";
import type { BattleConfig } from "../types";

describe("戦術統合テスト", () => {
  it("デフォルト戦術（nearest）同士の対戦", () => {
    const cfg: BattleConfig = {
      seed: 12345,
      arenaRadius: 300,
      tickRate: 60,
      teams: [
        {
          id: "A",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              // tacticId 未指定 = デフォルト "nearest"
            },
          ],
        },
        {
          id: "B",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
            },
          ],
        },
      ],
    };

    const log = simulateBattle(cfg, { maxSeconds: 10 });
    const lastFrame = log.frames[log.frames.length - 1];
    expect(lastFrame.winner).not.toBeNull();
    expect(log.frames.length).toBeGreaterThan(0);
  });

  it("Aggressive 戦術 vs Defensive 戦術", () => {
    const cfg: BattleConfig = {
      seed: 42,
      arenaRadius: 300,
      tickRate: 60,
      teams: [
        {
          id: "Aggressive",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "aggressive",
            },
          ],
        },
        {
          id: "Defensive",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "defensive",
            },
          ],
        },
      ],
    };

    const log = simulateBattle(cfg, { maxSeconds: 10 });
    const lastFrame = log.frames[log.frames.length - 1];
    expect(lastFrame.winner).not.toBeNull();
    expect(log.frames.length).toBeGreaterThan(0);
  });

  it("Nearest 戦術 vs Aggressive 戦術", () => {
    const cfg: BattleConfig = {
      seed: 999,
      arenaRadius: 300,
      tickRate: 60,
      teams: [
        {
          id: "Nearest",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "nearest",
            },
          ],
        },
        {
          id: "Aggressive",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "aggressive",
            },
          ],
        },
      ],
    };

    const log = simulateBattle(cfg, { maxSeconds: 10 });
    const lastFrame = log.frames[log.frames.length - 1];
    expect(lastFrame.winner).not.toBeNull();
    expect(log.frames.length).toBeGreaterThan(0);
  });

  it("複数の戦術IDが混在したチーム戦（3v3）", () => {
    const cfg: BattleConfig = {
      seed: 777,
      arenaRadius: 400,
      tickRate: 60,
      teams: [
        {
          id: "TeamA",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "aggressive",
            },
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "defensive",
            },
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "nearest",
            },
          ],
        },
        {
          id: "TeamB",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "nearest",
            },
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "aggressive",
            },
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "defensive",
            },
          ],
        },
      ],
    };

    const log = simulateBattle(cfg, { maxSeconds: 20 });
    const lastFrame = log.frames[log.frames.length - 1];
    expect(lastFrame.winner).not.toBeNull();
    expect(log.frames.length).toBeGreaterThan(0);

    // 最終フレームで片方のチームが全滅していることを確認
    const teamAAlive = lastFrame.fighters.filter(
      (f) => f.teamId === "TeamA" && f.alive
    ).length;
    const teamBAlive = lastFrame.fighters.filter(
      (f) => f.teamId === "TeamB" && f.alive
    ).length;

    expect(teamAAlive === 0 || teamBAlive === 0).toBe(true);
  });

  it("同じシード・設定で決定論的な結果が得られる", () => {
    const cfg: BattleConfig = {
      seed: 555,
      arenaRadius: 300,
      tickRate: 60,
      teams: [
        {
          id: "A",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "aggressive",
            },
          ],
        },
        {
          id: "B",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 80,
              speed: 50,
              cooldown: 0.5,
              tacticId: "defensive",
            },
          ],
        },
      ],
    };

    const log1 = simulateBattle(cfg, { maxSeconds: 10 });
    const log2 = simulateBattle(cfg, { maxSeconds: 10 });

    const lastFrame1 = log1.frames[log1.frames.length - 1];
    const lastFrame2 = log2.frames[log2.frames.length - 1];

    expect(lastFrame1.winner).toBe(lastFrame2.winner);
    expect(log1.frames.length).toBe(log2.frames.length);
    expect(lastFrame1).toEqual(lastFrame2);
  });
});
