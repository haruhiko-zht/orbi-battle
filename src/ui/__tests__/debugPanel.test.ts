import { describe, it, expect, beforeEach, vi } from "vitest";
import { createDebugPanel } from "../debugPanel";
import type { BattleConfig } from "../../sim/types";

describe("createDebugPanel", () => {
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
      hpMax: 120,
      atk: 12,
      range: 35,
      speed: 55,
      cooldown: 0.6,
    },
  };

  beforeEach(() => {
    // DOM環境をクリア
    document.body.innerHTML = '<div id="overlay"></div>';
    // window.$orbi をクリア
    (window as any).$orbi = undefined;
  });

  it("オーバーレイ要素にパネルを作成する", () => {
    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay");
    expect(overlay).not.toBeNull();
    expect(overlay!.children.length).toBeGreaterThan(0);
  });

  it("設定に基づいて入力フィールドを生成する", () => {
    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const inputs = overlay.querySelectorAll('input[type="number"]');

    // 13個の入力フィールド（seed, radius, tick, A×5, B×5）
    expect(inputs.length).toBe(13);
  });

  it("各入力フィールドに初期値が設定される", () => {
    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const inputs = overlay.querySelectorAll('input[type="number"]');

    // seed
    expect((inputs[0] as HTMLInputElement).value).toBe("12345");
    // radius
    expect((inputs[1] as HTMLInputElement).value).toBe("200");
    // tick
    expect((inputs[2] as HTMLInputElement).value).toBe("60");
    // A.hp
    expect((inputs[3] as HTMLInputElement).value).toBe("100");
    // A.atk
    expect((inputs[4] as HTMLInputElement).value).toBe("10");
  });

  it("Restartボタンが生成される", () => {
    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const button = overlay.querySelector("button");

    expect(button).not.toBeNull();
    expect(button!.textContent).toBe("Restart");
  });

  it("各入力フィールドにラベルが付いている", () => {
    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const labels = overlay.querySelectorAll("label");

    expect(labels.length).toBe(13);
    expect(labels[0].textContent).toBe("seed");
    expect(labels[1].textContent).toBe("radius");
    expect(labels[2].textContent).toBe("tick");
    expect(labels[3].textContent).toBe("A.hp");
    expect(labels[4].textContent).toBe("A.atk");
  });

  it("Restartボタンをクリックするとwindow.$orbi.resetが呼ばれる", () => {
    // モックresetを設定
    const mockReset = vi.fn();
    (window as any).$orbi = { reset: mockReset };

    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const button = overlay.querySelector("button") as HTMLButtonElement;

    // ボタンをクリック
    button.click();

    // resetが呼ばれたことを確認
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith(defaultConfig);
  });

  it("入力値を変更してRestartすると新しい設定が渡される", () => {
    const mockReset = vi.fn();
    (window as any).$orbi = { reset: mockReset };

    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const inputs = overlay.querySelectorAll(
      'input[type="number"]'
    ) as NodeListOf<HTMLInputElement>;
    const button = overlay.querySelector("button") as HTMLButtonElement;

    // seed を変更
    inputs[0].value = "99999";
    // radius を変更
    inputs[1].value = "300";
    // A.hp を変更
    inputs[3].value = "150";

    button.click();

    // 新しい設定で reset が呼ばれたことを確認
    expect(mockReset).toHaveBeenCalledWith({
      seed: 99999,
      arenaRadius: 300,
      tickRate: 60,
      fighterA: {
        hpMax: 150,
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
  });

  it("window.$orbiが未定義でもエラーにならない", () => {
    (window as any).$orbi = undefined;

    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const button = overlay.querySelector("button") as HTMLButtonElement;

    // エラーを投げずにクリックできる
    expect(() => button.click()).not.toThrow();
  });

  it("既存のオーバーレイ内容をクリアする", () => {
    const overlay = document.getElementById("overlay")!;
    overlay.innerHTML = "<div>existing content</div>";

    createDebugPanel(defaultConfig);

    // 既存の内容がクリアされている
    expect(overlay.textContent).not.toContain("existing content");
  });

  it("複数回呼び出しても正しく動作する", () => {
    createDebugPanel(defaultConfig);
    const overlay = document.getElementById("overlay")!;
    const firstChildCount = overlay.children.length;

    // 異なる設定で再度呼び出し
    const newConfig: BattleConfig = {
      ...defaultConfig,
      seed: 99999,
      arenaRadius: 300,
    };
    createDebugPanel(newConfig);

    // 子要素の数が同じ（既存が置き換えられた）
    expect(overlay.children.length).toBe(firstChildCount);

    // 新しい値が設定されている
    const inputs = overlay.querySelectorAll('input[type="number"]');
    expect((inputs[0] as HTMLInputElement).value).toBe("99999");
    expect((inputs[1] as HTMLInputElement).value).toBe("300");
  });

  it("step属性が正しく設定される", () => {
    createDebugPanel(defaultConfig);

    const overlay = document.getElementById("overlay")!;
    const inputs = overlay.querySelectorAll(
      'input[type="number"]'
    ) as NodeListOf<HTMLInputElement>;

    // 通常のフィールドは step="1"
    expect(inputs[0].step).toBe("1"); // seed
    expect(inputs[1].step).toBe("1"); // radius

    // cooldown フィールドは step="0.01"
    expect(inputs[7].step).toBe("0.01"); // A.cd
    expect(inputs[12].step).toBe("0.01"); // B.cd
  });
});
