import type { BattleConfig, BattleState, FighterState, Vec2 } from "../types";
import type { FighterTactic } from "../tactics";

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

export type StrategyBehavior = {
  kind: "strategy";
  targeting: TargetingStrategy;
  movement: MovementStrategy;
};

export type TacticBehavior = {
  kind: "tactic";
  tactic: FighterTactic;
};

export type FighterBehavior = StrategyBehavior | TacticBehavior;

export type FighterBehaviorDecision = {
  targetId: string | null;
  moveDirection: Vec2 | null;
};
