import type {
  BehaviorContext,
  FighterBehavior,
  FighterBehaviorDecision,
} from "./types";

export function decideBehavior(
  behavior: FighterBehavior,
  context: BehaviorContext
): FighterBehaviorDecision {
  if (behavior.kind === "tactic") {
    const decision = behavior.tactic.decide(
      context.self,
      context.enemies,
      context.config.arenaRadius
    );
    return {
      targetId: decision.targetId,
      moveDirection: decision.moveDirection,
    };
  }

  const selection = behavior.targeting.select(context);
  const moveDirection = behavior.movement.compute({
    ...context,
    ...selection,
  });

  return {
    targetId: selection.target ? selection.target.id : null,
    moveDirection,
  };
}
