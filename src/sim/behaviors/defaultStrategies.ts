import { findNearestEnemy, normalizeVector } from "../tactics/utils";
import {
  registerMovementStrategy,
  registerTargetingStrategy,
} from "./registry";
import type {
  BehaviorContext,
  MovementContext,
  MovementStrategy,
  TargetSelection,
  TargetingStrategy,
} from "./types";

class NearestTargeting implements TargetingStrategy {
  select({ self, enemies }: BehaviorContext): TargetSelection {
    const nearest = findNearestEnemy(self, enemies);
    if (!nearest) {
      return { target: null, delta: null, distance: null };
    }
    return {
      target: nearest.fighter,
      delta: nearest.delta,
      distance: nearest.distance,
    };
  }
}

class ApproachMovement implements MovementStrategy {
  compute({ target, delta }: MovementContext) {
    if (!target || !delta) return null;
    return normalizeVector(delta.x, delta.y);
  }
}

class HoldDistanceMovement implements MovementStrategy {
  constructor(private readonly ratio: number) {}

  compute({ self, target, delta, distance }: MovementContext) {
    if (!target || !delta || distance == null) return null;
    const safeDistance = self.params.range * this.ratio;
    if (distance < safeDistance) {
      return normalizeVector(-delta.x, -delta.y);
    }
    if (distance > self.params.range) {
      return normalizeVector(delta.x, delta.y);
    }
    return null;
  }
}

class AdaptiveRangeMovement implements MovementStrategy {
  compute({ self, delta, distance }: MovementContext) {
    if (!delta || distance == null) return null;
    if (distance > self.params.range) {
      return normalizeVector(delta.x, delta.y);
    }
    return null;
  }
}

function ensureDefaultRegistrations() {
  registerTargetingStrategy("targeting.nearest", new NearestTargeting());

  registerMovementStrategy("movement.approach", new ApproachMovement());
  registerMovementStrategy(
    "movement.hold-distance",
    new HoldDistanceMovement(0.8)
  );
  registerMovementStrategy(
    "movement.adaptive-range",
    new AdaptiveRangeMovement()
  );
}

let registered = false;

export function registerDefaultBehaviorStrategies() {
  if (registered) return;
  ensureDefaultRegistrations();
  registered = true;
}

export function resolveFallbackMovementId(
  tacticId: string | undefined
): string {
  switch (tacticId) {
    case "aggressive":
      return "movement.approach";
    case "defensive":
      return "movement.hold-distance";
    case "nearest":
    default:
      return "movement.adaptive-range";
  }
}

export function resolveFallbackTargetingId(): string {
  return "targeting.nearest";
}
