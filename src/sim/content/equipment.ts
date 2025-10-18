import equipmentData from "../../data/equipment.json";
import type { EquipmentDefinition, EquipmentSlot } from "../../types/content";

const equipmentMap = new Map<string, EquipmentDefinition>();
const equipmentBySlot = new Map<EquipmentSlot, EquipmentDefinition[]>();

for (const item of equipmentData as EquipmentDefinition[]) {
  equipmentMap.set(item.id, item);
  const slotItems = equipmentBySlot.get(item.slot) ?? [];
  slotItems.push(item);
  equipmentBySlot.set(item.slot, slotItems);
}

export function getEquipmentDefinition(
  equipmentId?: string
): EquipmentDefinition | undefined {
  if (!equipmentId) return undefined;
  return equipmentMap.get(equipmentId);
}

export function getEquipmentBySlot(slot: EquipmentSlot): EquipmentDefinition[] {
  return [...(equipmentBySlot.get(slot) ?? [])];
}

export function getAllEquipment(): EquipmentDefinition[] {
  return Array.from(equipmentMap.values());
}
