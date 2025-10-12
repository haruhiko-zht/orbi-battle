import type { BattleConfig } from "../sim/types";
import { presets, type PresetName } from "../config/defaults";
import type { AIType } from "../sim/ai/types";

/** デバッグパネルで選択可能なAIタイプ */
const AI_TYPE_OPTIONS: AIType[] = ["nearest", "aggressive", "defensive"];

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
 * 選択肢付きドロップダウンを生成するヘルパー関数
 * @param label ラベルテキスト
 * @param value 初期値
 * @param options 選択肢リスト
 * @returns ラップ要素とselect要素
 */
function selectInput(label: string, value: string, options: readonly string[]) {
  const wrap = document.createElement("div");
  const l = document.createElement("label");
  l.textContent = label;
  const s = document.createElement("select");
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    s.appendChild(option);
  });
  s.value = value;
  wrap.appendChild(l);
  wrap.appendChild(s);
  return { wrap, select: s };
}

/**
 * デバッグパネルを生成
 * - パラメータ調整用のUI
 * - Restartボタンで新しい設定でバトルをリセット
 * - window.$orbi.reset() を経由してPhaserシーンと連携
 *
 * @param cfg 初期設定
 */
export function createDebugPanel(cfg: BattleConfig, presetName?: PresetName) {
  const overlay = document.getElementById("overlay")!;
  overlay.innerHTML = "";

  // プリセット選択ドロップダウン
  const presetWrap = document.createElement("div");
  const presetLabel = document.createElement("label");
  presetLabel.textContent = "Preset";
  const presetSelect = document.createElement("select");
  const presetEntries = Object.entries(presets);
  const currentPresetName =
    presetName ??
    (presetEntries.find(([, preset]) => preset === cfg)?.[0] as
      | PresetName
      | undefined);

  // プリセットオプションを追加
  presetEntries.forEach(([name]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === currentPresetName) {
      option.selected = true;
    }
    presetSelect.appendChild(option);
  });

  if (!presetSelect.value && presetSelect.options.length > 0) {
    presetSelect.value = presetSelect.options[0].value;
  }

  presetWrap.appendChild(presetLabel);
  presetWrap.appendChild(presetSelect);
  overlay.appendChild(presetWrap);

  // プリセット変更時の処理
  presetSelect.onchange = () => {
    const name = presetSelect.value as PresetName;
    const selectedPreset = presets[name];
    window.$orbi?.reset?.(selectedPreset);
    createDebugPanel(selectedPreset, name);
  };

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
    aiType: HTMLSelectElement;
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

      type NumericFighterParam =
        | "hpMax"
        | "atk"
        | "range"
        | "speed"
        | "cooldown";

      const fields: Array<{
        key: NumericFighterParam;
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
          fighter[key] as number,
          step
        );
        container.appendChild(wrap);
        inputs[key] = input;
      });

      const { wrap: aiWrap, select: aiSelect } = selectInput(
        `${labelBase}.ai`,
        fighter.aiType ?? "nearest",
        AI_TYPE_OPTIONS
      );
      container.appendChild(aiWrap);

      section.appendChild(container);
      fighterControls.push({ inputs, aiType: aiSelect });
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
        fighters: teamCtrl.fighters.map(({ inputs, aiType }) => ({
          hpMax: Number(inputs.hpMax.value),
          atk: Number(inputs.atk.value),
          range: Number(inputs.range.value),
          speed: Number(inputs.speed.value),
          cooldown: Number(inputs.cooldown.value),
          aiType: (aiType.value as AIType) ?? "nearest",
        })),
      })),
    };
    window.$orbi?.reset?.(next);
  };
}
