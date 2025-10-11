import type { BattleConfig } from "../sim/types";

/**
 * 数値入力フィールドを生成するヘルパー関数
 * @param label ラベルテキスト
 * @param value 初期値
 * @param step ステップ値（デフォルト: 1）
 * @returns ラップ要素とinput要素
 */
function numberInput(label: string, value: number, step = 1) {
  const wrap = document.createElement("div");
  const l = document.createElement("label");
  l.textContent = label;
  const i = document.createElement("input");
  i.type = "number";
  i.value = String(value);
  i.step = String(step);
  wrap.appendChild(l);
  wrap.appendChild(i);
  return { wrap, input: i };
}

/**
 * デバッグパネルを生成
 * - パラメータ調整用のUI
 * - Restartボタンで新しい設定でバトルをリセット
 * - window.$orbi.reset() を経由してPhaserシーンと連携
 *
 * @param cfg 初期設定
 */
export function createDebugPanel(cfg: BattleConfig) {
  const overlay = document.getElementById("overlay")!;
  overlay.innerHTML = "";

  const seed = numberInput("seed", cfg.seed);
  const radius = numberInput("radius", cfg.arenaRadius);
  const tick = numberInput("tick", cfg.tickRate);
  const aHp = numberInput("A.hp", cfg.fighterA.hpMax);
  const aAtk = numberInput("A.atk", cfg.fighterA.atk);
  const aRange = numberInput("A.range", cfg.fighterA.range);
  const aSpd = numberInput("A.spd", cfg.fighterA.speed);
  const aCd = numberInput("A.cd", cfg.fighterA.cooldown, 0.01);
  const bHp = numberInput("B.hp", cfg.fighterB.hpMax);
  const bAtk = numberInput("B.atk", cfg.fighterB.atk);
  const bRange = numberInput("B.range", cfg.fighterB.range);
  const bSpd = numberInput("B.spd", cfg.fighterB.speed);
  const bCd = numberInput("B.cd", cfg.fighterB.cooldown, 0.01);

  const btn = document.createElement("button");
  btn.textContent = "Restart";

  const rows = [
    seed,
    radius,
    tick,
    aHp,
    aAtk,
    aRange,
    aSpd,
    aCd,
    bHp,
    bAtk,
    bRange,
    bSpd,
    bCd,
  ];
  rows.forEach((r) => overlay.appendChild(r.wrap));
  overlay.appendChild(btn);

  // Restartボタンのクリックハンドラ
  btn.onclick = () => {
    const next: BattleConfig = {
      seed: Number(seed.input.value),
      arenaRadius: Number(radius.input.value),
      tickRate: Number(tick.input.value),
      fighterA: {
        hpMax: Number(aHp.input.value),
        atk: Number(aAtk.input.value),
        range: Number(aRange.input.value),
        speed: Number(aSpd.input.value),
        cooldown: Number(aCd.input.value),
      },
      fighterB: {
        hpMax: Number(bHp.input.value),
        atk: Number(bAtk.input.value),
        range: Number(bRange.input.value),
        speed: Number(bSpd.input.value),
        cooldown: Number(bCd.input.value),
      },
    };
    // @ts-expect-error
    window.$orbi?.reset?.(next);
  };
}
