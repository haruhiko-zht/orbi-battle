import type { MovementStrategy, TargetingStrategy } from "./types";

const targetingStrategies = new Map<string, TargetingStrategy>();
const movementStrategies = new Map<string, MovementStrategy>();

export function registerTargetingStrategy(
  id: string,
  strategy: TargetingStrategy
) {
  targetingStrategies.set(id, strategy);
}

export function getTargetingStrategy(
  id: string
): TargetingStrategy | undefined {
  return targetingStrategies.get(id);
}

export function registerMovementStrategy(
  id: string,
  strategy: MovementStrategy
) {
  movementStrategies.set(id, strategy);
}

export function getMovementStrategy(id: string): MovementStrategy | undefined {
  return movementStrategies.get(id);
}

export function listTargetingStrategyIds(): string[] {
  return Array.from(targetingStrategies.keys());
}

export function listMovementStrategyIds(): string[] {
  return Array.from(movementStrategies.keys());
}
