import { createPlayers, TRACK_DETAILS } from "../gameData.js";
import {
    PLAYER_STARTING_STATS,
    SCHOOL_STATUS_WHOLE,
} from "./constants.js";
import { getActionsForPlayer } from "./rules.js";

export function createInitialPlayers() {
    return createPlayers().map((player, index) => ({
        ...player,
        ...PLAYER_STARTING_STATS[player.name],
        reputation: 3,
        techniques: { black: 0, brown: 0, gold: 0 },
        hitPoints: 3,
        formPoints: 2,
        bonusActionsNextTurn: 0,
        injured: false,
        arrivalOrder: index,
        alive: true,
    }));
}

export function createSchools() {
    return TRACK_DETAILS.filter((location) => location.type === "town").map((location) => ({
        id: location.id,
        name: location.name,
        status: SCHOOL_STATUS_WHOLE,
        saveProgress: 0,
        isCompletingSave: false,
        defenders: [],
    }));
}

export function clonePlayersSnapshot(players) {
    return players.map((player) => ({ ...player }));
}

export function cloneSchoolsSnapshot(schools) {
    return schools.map((school) => ({
        ...school,
        defenders: Array.isArray(school.defenders) ? school.defenders.slice() : school.defenders,
    }));
}

export function createInitialGameState() {
    const players = createInitialPlayers();

    return {
        players,
        schools: createSchools(),
        currentPlayerIndex: 0,
        actionsRemaining: getActionsForPlayer(players[0]),
        currentTurnBonusActionsRemaining: 0,
        nextArrivalOrder: createPlayers().length,
    };
}
