import { describe, it, expect } from "vitest";
import { makeRng } from "../rng";

describe("makeRng", () => {
  it("0.0から1.0の範囲の乱数を生成する", () => {
    const rng = makeRng(12345);

    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("決定論的動作: 同じシードで同じ数列", () => {
    const rng1 = makeRng(12345);
    const rng2 = makeRng(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("異なるシードで異なる数列", () => {
    const rng1 = makeRng(12345);
    const rng2 = makeRng(67890);

    let differentCount = 0;
    for (let i = 0; i < 100; i++) {
      if (rng1() !== rng2()) {
        differentCount++;
      }
    }

    // ほぼすべての値が異なるはず
    expect(differentCount).toBeGreaterThan(95);
  });

  it("シード0でも動作する", () => {
    const rng = makeRng(0);

    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("負のシードでも動作する（符号なし32bitに変換される）", () => {
    const rng = makeRng(-1);

    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("大きなシード値でも動作する", () => {
    const rng = makeRng(2147483647); // 2^31 - 1

    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("連続呼び出しで異なる値を生成する", () => {
    const rng = makeRng(12345);
    const values = new Set<number>();

    // 100回呼び出して、少なくとも95個は異なる値であることを期待
    for (let i = 0; i < 100; i++) {
      values.add(rng());
    }

    expect(values.size).toBeGreaterThan(95);
  });

  it("分布の基本チェック（極端に偏っていない）", () => {
    const rng = makeRng(12345);
    let below50 = 0;
    let above50 = 0;

    for (let i = 0; i < 1000; i++) {
      const value = rng();
      if (value < 0.5) {
        below50++;
      } else {
        above50++;
      }
    }

    // 0.5以下と0.5以上がおおよそ半々（400〜600の範囲）
    expect(below50).toBeGreaterThan(400);
    expect(below50).toBeLessThan(600);
    expect(above50).toBeGreaterThan(400);
    expect(above50).toBeLessThan(600);
  });

  it("再現性: 特定のシードから特定の値を生成", () => {
    const rng = makeRng(42);

    // 最初の5つの値が期待通りか確認（スナップショット）
    const values = [rng(), rng(), rng(), rng(), rng()];

    // スナップショットテスト
    expect(values).toMatchSnapshot();
  });

  it("長いシーケンスでも決定論的", () => {
    const rng1 = makeRng(99999);
    const rng2 = makeRng(99999);

    // 10000回呼び出しても同じ
    for (let i = 0; i < 10000; i++) {
      expect(rng1()).toBe(rng2());
    }
  });
});
