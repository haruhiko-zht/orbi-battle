import { useEffect, useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { presets, type PresetName } from "../config/defaults";
import { cloneConfig } from "../sim/log";
import type { AIType } from "../sim/ai/types";
import type { BattleConfig } from "../sim/types";
import { orbiBridge } from "./api/orbiBridge";

const AI_TYPE_OPTIONS: AIType[] = ["nearest", "aggressive", "defensive"];
type PresetSelection = PresetName | "custom";

let root: Root | null = null;

export function createDebugPanel(cfg: BattleConfig, presetName?: PresetName) {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  if (!root) {
    overlay.replaceChildren();
    root = createRoot(overlay);
  }
  root.render(
    <DebugPanelApp
      initialConfig={cloneConfig(cfg)}
      initialPresetName={presetName}
    />
  );
}

type DebugPanelProps = {
  initialConfig: BattleConfig;
  initialPresetName?: PresetName;
};

function DebugPanelApp({ initialConfig, initialPresetName }: DebugPanelProps) {
  const presetEntries = useMemo(
    () => Object.entries(presets) as Array<[PresetName, BattleConfig]>,
    []
  );

  const [config, setConfig] = useState<BattleConfig>(() =>
    cloneConfig(initialConfig)
  );

  const [selectedPreset, setSelectedPreset] = useState<PresetSelection>(() => {
    const matched = findPresetMatch(initialConfig, presetEntries);
    return initialPresetName ?? matched ?? "custom";
  });

  useEffect(() => {
    setConfig(cloneConfig(initialConfig));
    const matched = findPresetMatch(initialConfig, presetEntries);
    setSelectedPreset(initialPresetName ?? matched ?? "custom");
  }, [initialConfig, initialPresetName, presetEntries]);

  const presetOptions = useMemo(
    () => presetEntries.map(([name]) => name),
    [presetEntries]
  );

  const updateConfig = (mutate: (draft: BattleConfig) => void) => {
    setConfig((prev) => {
      const next = cloneConfig(prev);
      mutate(next);
      return next;
    });
    setSelectedPreset("custom");
  };

  const handlePresetChange = (value: string) => {
    if (isPresetName(value)) {
      const presetCfg = cloneConfig(presets[value]);
      setConfig(presetCfg);
      setSelectedPreset(value);
      orbiBridge.reset(presetCfg);
      return;
    }
    setSelectedPreset("custom");
  };

  const handleRestart = () => {
    orbiBridge.reset(cloneConfig(config));
    const matched = findPresetMatch(config, presetEntries);
    setSelectedPreset(matched ?? "custom");
  };

  return (
    <div className="debug-panel">
      <DropdownInput
        label="Preset"
        value={selectedPreset}
        options={[...presetOptions, "custom"]}
        onChange={handlePresetChange}
      />

      <fieldset>
        <legend>Global</legend>
        <NumberInput
          label="seed"
          value={config.seed}
          onChange={(value) => updateConfig((draft) => (draft.seed = value))}
        />
        <NumberInput
          label="radius"
          value={config.arenaRadius}
          onChange={(value) =>
            updateConfig((draft) => (draft.arenaRadius = value))
          }
        />
        <NumberInput
          label="tick"
          value={config.tickRate}
          onChange={(value) =>
            updateConfig((draft) => (draft.tickRate = value))
          }
        />
      </fieldset>

      {config.teams.map((team, teamIndex) => (
        <section key={team.id} className="debug-team">
          <h3>Team {team.id}</h3>
          {team.fighters.length === 0 ? (
            <p>No fighters configured.</p>
          ) : (
            team.fighters.map((fighter, fighterIndex) => {
              const labelBase =
                team.fighters.length === 1
                  ? `${team.id}`
                  : `${team.id}[${fighterIndex}]`;
              return (
                <div className="fighter-controls" key={labelBase}>
                  <NumberInput
                    label={`${labelBase}.hp`}
                    value={fighter.hpMax}
                    onChange={(value) =>
                      updateConfig(
                        (draft) =>
                          (draft.teams[teamIndex].fighters[fighterIndex].hpMax =
                            value)
                      )
                    }
                  />
                  <NumberInput
                    label={`${labelBase}.atk`}
                    value={fighter.atk}
                    onChange={(value) =>
                      updateConfig(
                        (draft) =>
                          (draft.teams[teamIndex].fighters[fighterIndex].atk =
                            value)
                      )
                    }
                  />
                  <NumberInput
                    label={`${labelBase}.range`}
                    value={fighter.range}
                    onChange={(value) =>
                      updateConfig(
                        (draft) =>
                          (draft.teams[teamIndex].fighters[fighterIndex].range =
                            value)
                      )
                    }
                  />
                  <NumberInput
                    label={`${labelBase}.spd`}
                    value={fighter.speed}
                    onChange={(value) =>
                      updateConfig(
                        (draft) =>
                          (draft.teams[teamIndex].fighters[fighterIndex].speed =
                            value)
                      )
                    }
                  />
                  <NumberInput
                    label={`${labelBase}.cd`}
                    value={fighter.cooldown}
                    step={0.01}
                    onChange={(value) =>
                      updateConfig(
                        (draft) =>
                          (draft.teams[teamIndex].fighters[
                            fighterIndex
                          ].cooldown = value)
                      )
                    }
                  />
                  <DropdownInput
                    label={`${labelBase}.ai`}
                    value={fighter.aiType ?? "nearest"}
                    options={AI_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateConfig((draft) => {
                        draft.teams[teamIndex].fighters[fighterIndex].aiType =
                          value as AIType;
                      })
                    }
                  />
                </div>
              );
            })
          )}
        </section>
      ))}

      <button type="button" onClick={handleRestart}>
        Restart
      </button>
    </div>
  );
}

type NumberInputProps = {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
};

function NumberInput({ label, value, step = 1, onChange }: NumberInputProps) {
  return (
    <label className="debug-input">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

type DropdownInputProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function DropdownInput({
  label,
  value,
  options,
  onChange,
}: DropdownInputProps) {
  return (
    <label className="debug-input">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function isPresetName(value: string): value is PresetName {
  return Object.prototype.hasOwnProperty.call(presets, value);
}

function findPresetMatch(
  cfg: BattleConfig,
  entries: Array<[PresetName, BattleConfig]>
): PresetName | undefined {
  return entries.find(([, presetCfg]) => areConfigsEqual(cfg, presetCfg))?.[0];
}

function areConfigsEqual(a: BattleConfig, b: BattleConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
