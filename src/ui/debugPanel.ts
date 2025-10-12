import type { BattleConfig, FighterParams } from "../sim/types";

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

  const btn = document.createElement("button");
  btn.textContent = "Restart";

  const headerRows = [seed, radius, tick];
  headerRows.forEach((r) => overlay.appendChild(r.wrap));

  type FighterControl = {
    inputs: {
      hpMax: HTMLInputElement;
      atk: HTMLInputElement;
      range: HTMLInputElement;
      speed: HTMLInputElement;
      cooldown: HTMLInputElement;
    };
  };

  const controlsByTeam: Array<{
    id: string;
    fighters: FighterControl[];
  }> = [];

  cfg.teams.forEach((team) => {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.textContent = `Team ${team.id}`;
    section.appendChild(heading);

    if (team.fighters.length === 0) {
      const notice = document.createElement("p");
      notice.textContent = "No fighters configured.";
      section.appendChild(notice);
    }

    const fighterControls: FighterControl[] = [];

    team.fighters.forEach((fighter, fighterIndex) => {
      const labelBase =
        team.fighters.length === 1
          ? `${team.id}`
          : `${team.id}[${fighterIndex}]`;
      const container = document.createElement("div");
      container.className = "fighter-controls";

      const fields: Array<{
        key: keyof FighterParams;
        suffix: string;
        step?: number;
      }> = [
        { key: "hpMax", suffix: "hp" },
        { key: "atk", suffix: "atk" },
        { key: "range", suffix: "range" },
        { key: "speed", suffix: "spd" },
        { key: "cooldown", suffix: "cd", step: 0.01 },
      ];

      const inputs: FighterControl["inputs"] = {
        hpMax: document.createElement("input"),
        atk: document.createElement("input"),
        range: document.createElement("input"),
        speed: document.createElement("input"),
        cooldown: document.createElement("input"),
      };

      fields.forEach(({ key, suffix, step }) => {
        const { wrap, input } = numberInput(
          `${labelBase}.${suffix}`,
          fighter[key],
          step
        );
        container.appendChild(wrap);
        inputs[key] = input;
      });

      section.appendChild(container);
      fighterControls.push({ inputs });
    });

    overlay.appendChild(section);
    controlsByTeam.push({ id: team.id, fighters: fighterControls });
  });

  overlay.appendChild(btn);

  // Restartボタンのクリックハンドラ
  btn.onclick = () => {
    const next: BattleConfig = {
      seed: Number(seed.input.value),
      arenaRadius: Number(radius.input.value),
      tickRate: Number(tick.input.value),
      teams: controlsByTeam.map((teamCtrl) => ({
        id: teamCtrl.id,
        fighters: teamCtrl.fighters.map(({ inputs }) => ({
          hpMax: Number(inputs.hpMax.value),
          atk: Number(inputs.atk.value),
          range: Number(inputs.range.value),
          speed: Number(inputs.speed.value),
          cooldown: Number(inputs.cooldown.value),
        })),
      })),
    };
    // @ts-expect-error
    window.$orbi?.reset?.(next);
  };
}
