import type { FighterParams } from "../sim/types";

export type FighterStatKey = "hpMax" | "atk" | "range" | "speed" | "cooldown";

export type StatModifier = Partial<Record<FighterStatKey, number>>;

export type ModifierMap = {
  /** 戦闘開始時に固定反映される補正（加算ベース想定） */
  battleStart?: StatModifier;
  /** 将来的な条件付き補正のプレースホルダー */
  conditional?: Array<ConditionalModifier>;
};

export type ConditionalModifier = {
  /** 条件ID（例: "hp-below" など） */
  conditionId: string;
  /** 条件判定に利用するパラメータ */
  params?: Record<string, unknown>;
  /** 条件成立時に適用する補正 */
  stats: StatModifier;
};

export type JobDefinition = {
  id: string;
  name: string;
  description?: string;
  modifiers?: ModifierMap;
  attackPatternId?: string;
};

export type EquipmentSlot = "weapon" | "shoes" | "head" | "necklace";

export const EQUIPMENT_SLOTS = ["weapon", "shoes", "head", "necklace"] as const;

export function isEquipmentSlot(value: unknown): value is EquipmentSlot {
  return (
    typeof value === "string" &&
    (EQUIPMENT_SLOTS as ReadonlyArray<string>).includes(value)
  );
}

export type EquipmentDefinition = {
  id: string;
  slot: EquipmentSlot;
  name: string;
  description?: string;
  statModifiers?: StatModifier;
  strategies?: StrategyReferenceMap;
};

export type StrategyReferenceMap = {
  targeting?: string;
  movement?: string;
  attack?: string;
  switching?: string;
};

export type EquipmentLoadout = Partial<Record<EquipmentSlot, string>>;

export type FighterLoadout = {
  jobId?: string;
  equipment?: EquipmentLoadout;
};

export type FighterParamsWithLoadout = FighterParams & FighterLoadout;
