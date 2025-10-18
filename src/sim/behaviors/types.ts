import type { BattleConfig, BattleState, FighterState, Vec2 } from "../types";

export type BehaviorContext = {
  self: FighterState;
  enemies: FighterState[];
  state: BattleState;
  config: BattleConfig;
};

export type TargetSelection = {
  target: FighterState | null;
  delta: Vec2 | null;
  distance: number | null;
};

export interface TargetingStrategy {
  select(context: BehaviorContext): TargetSelection;
}

export type MovementContext = BehaviorContext & TargetSelection;

export interface MovementStrategy {
  compute(context: MovementContext): Vec2 | null;
}

export type FighterBehavior = {
  targeting: TargetingStrategy;
  movement: MovementStrategy;
};

export type FighterBehaviorDecision = {
  targetId: string | null;
  moveDirection: Vec2 | null;
};
