import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { presets, type PresetName } from "../config/defaults";
import { cloneConfig } from "../sim/log";
import { AI_TYPES, isAIType, type AIType } from "../sim/ai/types";
import type { BattleConfig, FighterParams } from "../sim/types";
import { orbiBridge } from "./api/orbiBridge";
import type { PlaybackInfo } from "../types/playback";

const PLAYBACK_RATE_OPTIONS = ["0.25", "0.5", "1", "1.5", "2", "4"] as const;
type PresetSelection = PresetName | "custom";

let root: Root | null = null;
let rootContainer: HTMLElement | null = null;

const DEFAULT_PLAYBACK_INFO: PlaybackInfo = {
  frameIndex: 0,
  frameCount: 0,
  isPaused: true,
  isFinished: true,
  playbackRate: 1,
};

type FighterNumberProp = Exclude<keyof FighterParams, "aiType">;

type FighterNumberField = {
  kind: "number";
  prop: FighterNumberProp;
  labelSuffix: string;
  step?: number;
  min?: number;
  max?: number;
};

type FighterSelectField = {
  kind: "select";
  prop: "aiType";
  labelSuffix: string;
  options: typeof AI_TYPES;
};

type FighterField = FighterNumberField | FighterSelectField;

const FIGHTER_FIELDS: FighterField[] = [
  { kind: "number", prop: "hpMax", labelSuffix: ".hp" },
  { kind: "number", prop: "atk", labelSuffix: ".atk" },
  { kind: "number", prop: "range", labelSuffix: ".range" },
  { kind: "number", prop: "speed", labelSuffix: ".spd" },
  { kind: "number", prop: "cooldown", labelSuffix: ".cd", step: 0.01 },
  { kind: "select", prop: "aiType", labelSuffix: ".ai", options: AI_TYPES },
];

type UpdateConfigFn = (mutate: (draft: BattleConfig) => void) => void;

function normalizeConfigForReset(cfg: BattleConfig): BattleConfig {
  const next = cloneConfig(cfg);
  next.teams.forEach((team) => {
    team.fighters.forEach((fighter) => {
      if (!fighter.aiType) {
        fighter.aiType = "nearest";
      }
    });
  });
  return next;
}

function applyValueAtPath(
  target: BattleConfig,
  path: string,
  value: number | string
) {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return;
  let node: any = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const index = Number(segment);
    if (Number.isInteger(index) && Array.isArray(node)) {
      node = node[index];
    } else {
      node = node[segment];
    }
    if (typeof node === "undefined" || node === null) {
      return;
    }
  }
  const last = segments[segments.length - 1];
  const index = Number(last);
  if (Number.isInteger(index) && Array.isArray(node)) {
    node[index] = value;
  } else {
    node[last] = value;
  }
}

function snapshotConfigFromDom(current: BattleConfig): BattleConfig {
  const next = cloneConfig(current);
  const numberInputs = document.querySelectorAll<HTMLInputElement>(
    "input[data-config-path]"
  );
  numberInputs.forEach((input) => {
    const path = input.dataset.configPath;
    if (!path) return;
    const numeric = Number(input.value);
    if (Number.isNaN(numeric)) return;
    applyValueAtPath(next, path, numeric);
  });

  const selects = document.querySelectorAll<HTMLSelectElement>(
    "select[data-config-path]"
  );
  selects.forEach((select) => {
    const path = select.dataset.configPath;
    if (!path) return;
    applyValueAtPath(next, path, select.value);
  });

  return next;
}

export function createDebugPanel(cfg: BattleConfig, presetName?: PresetName) {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  if (!root || rootContainer !== overlay) {
    if (root && rootContainer && rootContainer !== overlay) {
      root.unmount();
    }
    overlay.replaceChildren();
    root = createRoot(overlay);
    rootContainer = overlay;
  }
  const appKey = JSON.stringify(cfg);
  flushSync(() => {
    root!.render(
      <DebugPanelApp
        key={appKey}
        initialConfig={cloneConfig(cfg)}
        initialPresetName={presetName}
      />
    );
  });
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

  const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo>(() => {
    return orbiBridge.getPlaybackInfo() ?? DEFAULT_PLAYBACK_INFO;
  });
  const [frameInput, setFrameInput] = useState<number>(playbackInfo.frameIndex);

  useEffect(() => {
    setConfig(cloneConfig(initialConfig));
    const matched = findPresetMatch(initialConfig, presetEntries);
    setSelectedPreset(initialPresetName ?? matched ?? "custom");
  }, [initialConfig, initialPresetName, presetEntries]);

  const syncPlayback = useCallback(() => {
    const info = orbiBridge.getPlaybackInfo();
    if (info) {
      setPlaybackInfo(info);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(syncPlayback, 150);
    return () => window.clearInterval(timer);
  }, [syncPlayback]);

  useEffect(() => {
    setFrameInput(playbackInfo.frameIndex);
  }, [playbackInfo.frameIndex]);

  const presetOptions = useMemo(
    () => presetEntries.map(([name]) => name),
    [presetEntries]
  );

  const playbackRateOptions = useMemo(() => {
    const base = [...PLAYBACK_RATE_OPTIONS];
    const current = playbackInfo.playbackRate.toString();
    if (!base.includes(current as any)) {
      base.push(current as any);
    }
    return base;
  }, [playbackInfo.playbackRate]);

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
      flushSync(() => {
        setConfig(presetCfg);
        setSelectedPreset(value);
      });
      orbiBridge.reset(presetCfg);
      syncPlayback();
      return;
    }
    setSelectedPreset("custom");
  };

  const handleRestart = () => {
    const latestConfig = snapshotConfigFromDom(config);
    setConfig(latestConfig);
    orbiBridge.reset(normalizeConfigForReset(latestConfig));
    const matched = findPresetMatch(latestConfig, presetEntries);
    setSelectedPreset(matched ?? "custom");
    syncPlayback();
  };

  const handleTogglePlay = () => {
    if (playbackInfo.isPaused) {
      orbiBridge.play();
    } else {
      orbiBridge.pause();
    }
    syncPlayback();
  };

  const handleStepFrame = () => {
    orbiBridge.stepFrame();
    syncPlayback();
  };

  const handleSeekFrame = (value: number) => {
    if (!Number.isFinite(value)) return;
    const maxFrame =
      playbackInfo.frameCount > 0 ? playbackInfo.frameCount - 1 : 0;
    const clamped = Math.min(Math.max(Math.round(value), 0), maxFrame);
    setFrameInput(clamped);
    orbiBridge.seekFrame(clamped);
    syncPlayback();
  };

  const handlePlaybackRateChange = (value: string) => {
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate <= 0) return;
    orbiBridge.setPlaybackRate(rate);
    syncPlayback();
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
          dataPath="seed"
          onChange={(value) => updateConfig((draft) => (draft.seed = value))}
        />
        <NumberInput
          label="radius"
          value={config.arenaRadius}
          dataPath="arenaRadius"
          onChange={(value) =>
            updateConfig((draft) => (draft.arenaRadius = value))
          }
        />
        <NumberInput
          label="tick"
          value={config.tickRate}
          dataPath="tickRate"
          onChange={(value) =>
            updateConfig((draft) => (draft.tickRate = value))
          }
        />
      </fieldset>

      <button type="button" onClick={handleRestart}>
        Restart
      </button>

      <fieldset>
        <legend>Playback</legend>
        <div className="playback-controls">
          <button type="button" onClick={handleTogglePlay}>
            {playbackInfo.isPaused ? "Play" : "Pause"}
          </button>
          <button
            type="button"
            onClick={handleStepFrame}
            disabled={playbackInfo.isFinished}
          >
            Step
          </button>
        </div>
        <div className="playback-status">
          <span>
            Frame{" "}
            {playbackInfo.frameCount > 0
              ? playbackInfo.frameIndex + 1
              : playbackInfo.frameIndex}{" "}
            / {playbackInfo.frameCount}
          </span>
        </div>
        <NumberInput
          label="Frame"
          value={frameInput}
          min={0}
          max={Math.max(playbackInfo.frameCount - 1, 0)}
          step={undefined}
          type="text"
          inputMode="numeric"
          asLabel={false}
          onChange={handleSeekFrame}
        />
        <DropdownInput
          label="Speed"
          value={playbackInfo.playbackRate.toString()}
          options={playbackRateOptions}
          asLabel={false}
          onChange={handlePlaybackRateChange}
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
                <FighterControls
                  key={labelBase}
                  labelBase={labelBase}
                  fighter={fighter}
                  teamIndex={teamIndex}
                  fighterIndex={fighterIndex}
                  updateConfig={updateConfig}
                />
              );
            })
          )}
        </section>
      ))}
    </div>
  );
}

type FighterControlsProps = {
  labelBase: string;
  fighter: FighterParams;
  teamIndex: number;
  fighterIndex: number;
  updateConfig: UpdateConfigFn;
};

function FighterControls({
  labelBase,
  fighter,
  teamIndex,
  fighterIndex,
  updateConfig,
}: FighterControlsProps) {
  const applyFighterUpdate = (mutator: (params: FighterParams) => void) => {
    updateConfig((draft) => {
      const target = draft.teams[teamIndex]?.fighters?.[fighterIndex];
      if (!target) return;
      mutator(target);
    });
  };

  return (
    <div className="fighter-controls">
      {FIGHTER_FIELDS.map((field) => {
        const label = `${labelBase}${field.labelSuffix}`;
        const pathBase = `teams/${teamIndex}/fighters/${fighterIndex}`;
        if (field.kind === "number") {
          return (
            <NumberInput
              key={field.prop}
              label={label}
              value={fighter[field.prop]}
              step={field.step}
              min={field.min}
              max={field.max}
              dataPath={`${pathBase}/${field.prop}`}
              onChange={(value) =>
                applyFighterUpdate((params) => {
                  params[field.prop] = value;
                })
              }
            />
          );
        }
        const currentValue = fighter.aiType ?? "nearest";
        return (
          <DropdownInput
            key={field.prop}
            label={label}
            value={currentValue}
            options={field.options}
            dataPath={`${pathBase}/aiType`}
            onChange={(selected) => {
              if (!isAIType(selected)) return;
              applyFighterUpdate((params) => {
                params.aiType = selected;
              });
            }}
          />
        );
      })}
    </div>
  );
}

type NumberInputProps = {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  type?: HTMLInputTypeAttribute;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  asLabel?: boolean;
  dataPath?: string;
};

function NumberInput({
  label,
  value,
  step = 1,
  min,
  max,
  onChange,
  type = "number",
  inputMode,
  asLabel = true,
  dataPath,
}: NumberInputProps) {
  const Wrapper = asLabel ? "label" : "div";
  const stepValue = step !== undefined ? step : undefined;
  return (
    <Wrapper className="debug-input">
      <span>{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        data-config-path={dataPath}
        value={value}
        step={stepValue}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </Wrapper>
  );
}

type DropdownInputProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  asLabel?: boolean;
  dataPath?: string;
};

function DropdownInput({
  label,
  value,
  options,
  onChange,
  asLabel = true,
  dataPath,
}: DropdownInputProps) {
  const selectId = useId();
  const selectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    const element = selectRef.current;
    if (!element) return;
    const handler = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      onChange(target.value);
    };
    element.addEventListener("change", handler);
    return () => {
      element.removeEventListener("change", handler);
    };
  }, [onChange]);

  if (asLabel) {
    return (
      <div className="debug-input">
        <label htmlFor={selectId}>{label}</label>
        <select
          id={selectId}
          ref={selectRef}
          data-config-path={dataPath}
          value={value}
          onChange={() => {}}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="debug-input">
      <span>{label}</span>
      <select
        ref={selectRef}
        data-config-path={dataPath}
        value={value}
        onChange={() => {}}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
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
