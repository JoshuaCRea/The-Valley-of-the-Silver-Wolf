import { TRACK_DETAILS } from "../gameData.js";
import {
    advanceSilverWolf,
    consumeNextTurnActionBonus,
    getAlivePlayers,
    getNextLivingIndex,
    getSchoolById,
    lowerReputation,
} from "../domain/rules.js";
import {
    clonePlayersSnapshot,
    cloneSchoolsSnapshot,
} from "../domain/state.js";

const ALL_CHALLENGERS_DEAD = "Every challenger is dead. The Silver Wolf remains undefeated.";
const ALL_SCHOOLS_DESTROYED = "The Silver Wolf destroyed all five schools. The valley was not protected.";

export function advanceTurnState({
    currentPlayerIndex,
    players,
    schools,
    randomizer,
    getEventPlayerName,
    getSchoolEventLabel,
}) {
    const updatedPlayers = clonePlayersSnapshot(players);
    const updatedSchools = cloneSchoolsSnapshot(schools);
    const aliveAfterTurn = getAlivePlayers(updatedPlayers);

    if (aliveAfterTurn.length === 0) {
        return {
            players: updatedPlayers,
            schools: updatedSchools,
            logEntries: [],
            actionsRemaining: 0,
            currentTurnBonusActionsRemaining: 0,
            pendingRoll: null,
            nextPlayerIndex: currentPlayerIndex,
            gameOverReason: ALL_CHALLENGERS_DEAD,
        };
    }

    const turnLogs = [];
    const schoolsBeforeTurn = cloneSchoolsSnapshot(updatedSchools);
    const schoolsStillStanding = advanceSilverWolf(updatedSchools, turnLogs, {
        chooseIndex: randomizer.chooseIndex,
        getSchoolEventLabel,
        rollWhiteDie: randomizer.rollWhiteDie,
    });
    const destroyedSchoolCountBefore = schoolsBeforeTurn.filter((school) => school.status === "destroyed").length;
    const destroyedSchoolCountAfter = updatedSchools.filter((school) => school.status === "destroyed").length;
    const newlyDestroyedSchoolIds = updatedSchools
        .filter((school) => (
            school.status === "destroyed"
            && getSchoolById(schoolsBeforeTurn, school.id)?.status !== "destroyed"
        ))
        .map((school) => school.id);

    if (destroyedSchoolCountAfter > destroyedSchoolCountBefore) {
        updatedPlayers.forEach((player) => {
            lowerReputation(player, destroyedSchoolCountAfter - destroyedSchoolCountBefore);
        });
    }

    if (newlyDestroyedSchoolIds.length > 0) {
        updatedPlayers.forEach((player) => {
            const currentLocationId = TRACK_DETAILS[player.position]?.id;

            if (!player.alive || player.injured || !newlyDestroyedSchoolIds.includes(currentLocationId)) {
                return;
            }

            player.injured = true;
            turnLogs.push(`${getEventPlayerName(player)} is caught in the fall of ${getSchoolEventLabel(getSchoolById(updatedSchools, currentLocationId))} and becomes Injured.`);
        });
    }

    if (!schoolsStillStanding) {
        return {
            players: updatedPlayers,
            schools: updatedSchools,
            logEntries: turnLogs,
            actionsRemaining: 0,
            currentTurnBonusActionsRemaining: 0,
            pendingRoll: null,
            nextPlayerIndex: currentPlayerIndex,
            gameOverReason: ALL_SCHOOLS_DESTROYED,
        };
    }

    const nextPlayerIndex = getNextLivingIndex(updatedPlayers, currentPlayerIndex);
    const preparedTurn = consumeNextTurnActionBonus(updatedPlayers, nextPlayerIndex);

    return {
        players: preparedTurn.players,
        schools: updatedSchools,
        logEntries: turnLogs,
        actionsRemaining: preparedTurn.actions,
        currentTurnBonusActionsRemaining: preparedTurn.consumedBonusActions,
        pendingRoll: null,
        nextPlayerIndex,
        gameOverReason: "",
    };
}
