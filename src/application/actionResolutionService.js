export function resolveActionProgress({
    actionsRemaining,
    currentTurnBonusActionsRemaining,
    pendingRoll = null,
    refundedActions = 0,
}) {
    const nextActionsRemaining = Math.max(0, actionsRemaining - 1 + refundedActions);
    const nextBonusActionsRemaining = Math.max(0, currentTurnBonusActionsRemaining - 1);

    return {
        nextActionsRemaining,
        nextBonusActionsRemaining,
        pendingRoll,
        shouldEndTurn: nextActionsRemaining <= 0,
    };
}
