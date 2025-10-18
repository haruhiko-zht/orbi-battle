import type { FighterParams } from "../types";
import { getJobDefinition } from "../content/jobs";
import { getEquipmentDefinition } from "../content/equipment";
import { assertFinitePositive } from "../validation";
import type {
  EquipmentDefinition,
  EquipmentSlot,
  JobDefinition,
} from "../../types/content";
import { isEquipmentSlot } from "../../types/content";
import type { FighterBehavior } from "./types";
import {
  registerDefaultBehaviorStrategies,
  resolveFallbackMovementId,
  resolveFallbackTargetingId,
} from "./defaultStrategies";
import {
  getMovementStrategy,
  getTargetingStrategy,
} from "./registry";

const STAT_KEYS = ["hpMax", "atk", "range", "speed", "cooldown"] as const;

registerDefaultBehaviorStrategies();

type ResolvedEquipmentEntry = {
  slot: EquipmentSlot;
  definition: EquipmentDefinition;
};

export type ResolvedBehaviorInfo = {
  params: FighterParams;
  behavior: FighterBehavior;
};

export function resolveBehaviorForParams(
  baseParams: FighterParams
): ResolvedBehaviorInfo {
  const nextParams: FighterParams = {
    ...baseParams,
    equipment: baseParams.equipment
      ? { ...baseParams.equipment }
      : undefined,
  };

  const job = resolveJob(nextParams.jobId);
  const equipment = resolveEquipmentEntries(nextParams.equipment);

  applyLoadoutModifiers(nextParams, job, equipment);
  assertResolvedStatBounds(nextParams);

  const targetingId = resolveTargetingStrategyId(equipment);
  const movementId = resolveMovementStrategyId(nextParams.aiType, equipment);

  const targeting =
    getTargetingStrategy(targetingId) ??
    getTargetingStrategy(resolveFallbackTargetingId());
  const movement =
    getMovementStrategy(movementId) ??
    getMovementStrategy(resolveFallbackMovementId(baseParams.aiType));

  if (!targeting || !movement) {
    throw new Error(
      "戦略レジストリの初期化に失敗しています。ターゲティングまたは移動戦略が見つかりません。"
    );
  }

  return {
    params: nextParams,
    behavior: { targeting, movement },
  };
}

function resolveJob(jobId?: string): JobDefinition | undefined {
  if (!jobId) return undefined;
  const job = getJobDefinition(jobId);
  if (!job) {
    throw new Error(`未登録のジョブIDです: ${jobId}`);
  }
  return job;
}

function resolveEquipmentEntries(
  equipment: FighterParams["equipment"]
): ResolvedEquipmentEntry[] {
  if (!equipment) return [];
  const entries: ResolvedEquipmentEntry[] = [];
  for (const [slotKey, equipmentId] of Object.entries(equipment)) {
    if (!isEquipmentSlot(slotKey)) {
      throw new Error(`未定義の装備スロットです: ${slotKey}`);
    }
    if (typeof equipmentId !== "string" || equipmentId.length === 0) {
      throw new Error(`装備IDが不正です: slot=${slotKey}`);
    }
    const definition = getEquipmentDefinition(equipmentId);
    if (!definition) {
      throw new Error(`未登録の装備IDです: ${equipmentId}`);
    }
    if (definition.slot !== slotKey) {
      throw new Error(
        `装備スロットが一致しません: slot=${slotKey}, equipment=${equipmentId}`
      );
    }
    entries.push({ slot: slotKey, definition });
  }
  return entries;
}

function applyLoadoutModifiers(
  params: FighterParams,
  job: JobDefinition | undefined,
  equipment: ResolvedEquipmentEntry[]
) {
  const modifiers = collectStatModifiers(job, equipment);
  STAT_KEYS.forEach((key) => {
    const delta = modifiers[key];
    if (typeof delta === "number" && Number.isFinite(delta)) {
      params[key] += delta;
    }
  });
}

function assertResolvedStatBounds(params: FighterParams) {
  const basePath = "装備補正後の FighterParams";
  assertFinitePositive(params.hpMax, `${basePath}.hpMax`);
  assertFinitePositive(params.atk, `${basePath}.atk`);
  assertFinitePositive(params.range, `${basePath}.range`);
  assertFinitePositive(params.speed, `${basePath}.speed`, { allowZero: true });
  assertFinitePositive(params.cooldown, `${basePath}.cooldown`, {
    allowZero: true,
  });
}

type StatAccumulator = Record<(typeof STAT_KEYS)[number], number>;

function collectStatModifiers(
  job: JobDefinition | undefined,
  equipment: ResolvedEquipmentEntry[]
): StatAccumulator {
  const acc: StatAccumulator = {
    hpMax: 0,
    atk: 0,
    range: 0,
    speed: 0,
    cooldown: 0,
  };

  if (job?.modifiers?.battleStart) {
    for (const key of STAT_KEYS) {
      const value = job.modifiers.battleStart[key];
      if (typeof value === "number") {
        acc[key] += value;
      }
    }
  }

  for (const { definition } of equipment) {
    const modifiers = definition.statModifiers;
    if (!modifiers) continue;
    for (const key of STAT_KEYS) {
      const value = modifiers[key];
      if (typeof value === "number") {
        acc[key] += value;
      }
    }
  }

  return acc;
}

function resolveTargetingStrategyId(
  equipment: ResolvedEquipmentEntry[]
): string {
  const fromEquipment = resolveStrategyFromEquipment(equipment, (equip) => {
    return equip.strategies?.targeting;
  });
  if (fromEquipment) return fromEquipment;

  return resolveFallbackTargetingId();
}

function resolveMovementStrategyId(
  aiType: FighterParams["aiType"],
  equipment: ResolvedEquipmentEntry[]
): string {
  const fromEquipment = resolveStrategyFromEquipment(equipment, (equip) => {
    return equip.strategies?.movement;
  });
  if (fromEquipment) return fromEquipment;

  return resolveFallbackMovementId(aiType);
}

type StrategyExtractor = (equipment: EquipmentDefinition) => string | undefined;

function resolveStrategyFromEquipment(
  equipment: ResolvedEquipmentEntry[],
  extract: StrategyExtractor
): string | undefined {
  for (const { definition } of equipment) {
    const strategyId = extract(definition);
    if (strategyId) {
      return strategyId;
    }
  }
  return undefined;
}
