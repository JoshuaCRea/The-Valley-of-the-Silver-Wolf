import {
    clonePlayersSnapshot,
    cloneSchoolsSnapshot,
} from "../domain/state.js";

export function createUndoSnapshot({
    actionsRemaining,
    battleLog,
    nextArrivalOrder,
    pendingRoll,
    playerId,
    players,
    schools,
}) {
    return {
        playerId,
        players: clonePlayersSnapshot(players),
        schools: cloneSchoolsSnapshot(schools),
        actionsRemaining,
        nextArrivalOrder,
        battleLog: battleLog.slice(),
        pendingRoll,
    };
}

export function restoreUndoSnapshot(undoState) {
    return {
        players: clonePlayersSnapshot(undoState.players),
        schools: cloneSchoolsSnapshot(undoState.schools),
        actionsRemaining: undoState.actionsRemaining,
        nextArrivalOrder: undoState.nextArrivalOrder,
        battleLog: undoState.battleLog.slice(),
        pendingRoll: undoState.pendingRoll,
    };
}
