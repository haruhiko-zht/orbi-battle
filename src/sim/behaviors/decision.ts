import type { BehaviorContext, FighterBehaviorDecision } from "./types";
import type { FighterBehavior } from "./types";

export function decideBehavior(
  behavior: FighterBehavior,
  context: BehaviorContext
): FighterBehaviorDecision {
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
