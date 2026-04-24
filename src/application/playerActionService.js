import {
    SCHOOL_STATUS_SIEGED,
    SCHOOL_STATUS_WHOLE,
} from "../domain/constants.js";
import {
    buildCombatScore,
    canChallengeSilverWolf,
    getSchoolById,
    getSilverWolfStrength,
    grantSingleUseActionForNextTurn,
    lowerReputation,
    raiseReputation,
} from "../domain/rules.js";
import {
    clonePlayersSnapshot,
    cloneSchoolsSnapshot,
} from "../domain/state.js";

export function resolveTravelAction({
    currentPlayerIndex,
    direction,
    nextArrivalOrder,
    normalizeIndex,
    players,
    schools,
}) {
    const updatedPlayers = clonePlayersSnapshot(players);
    const updatedSchools = cloneSchoolsSnapshot(schools);
    const activePlayer = updatedPlayers[currentPlayerIndex];

    activePlayer.position = normalizeIndex(activePlayer.position + direction);
    activePlayer.arrivalOrder = nextArrivalOrder;

    return {
        players: updatedPlayers,
        schools: updatedSchools,
        logEntries: [],
        nextArrivalOrder: nextArrivalOrder + 1,
    };
}

export function resolveHealAction({
    currentLocation,
    currentPlayerIndex,
    getEventPlayerName,
    players,
    schools,
}) {
    const updatedPlayers = clonePlayersSnapshot(players);
    const updatedSchools = cloneSchoolsSnapshot(schools);
    const activePlayer = updatedPlayers[currentPlayerIndex];

    activePlayer.injured = false;

    return {
        players: updatedPlayers,
        schools: updatedSchools,
        logEntries: [`${getEventPlayerName(activePlayer)} heals at ${currentLocation.name}.`],
    };
}

export function resolveSaveSchoolAction({
    currentLocationId,
    currentPlayerId,
    currentPlayerName,
    getEventPlayerName,
    getSchoolEventLabel,
    players,
    schools,
}) {
    const updatedPlayers = clonePlayersSnapshot(players);
    const updatedSchools = cloneSchoolsSnapshot(schools);
    const school = getSchoolById(updatedSchools, currentLocationId);

    if (!school || school.status !== SCHOOL_STATUS_SIEGED) {
        return null;
    }

    const nextProgress = Math.min(3, (school.saveProgress || 0) + 1);

    school.saveProgress = nextProgress;
    school.defenders = school.defenders || [];

    if (!school.defenders.includes(currentPlayerId)) {
        school.defenders = school.defenders.concat(currentPlayerId);
    }

    if (nextProgress >= 3) {
        school.status = SCHOOL_STATUS_WHOLE;
        school.isCompletingSave = true;

        updatedPlayers.forEach((player) => {
            if (school.defenders.includes(player.id)) {
                raiseReputation(player, 1);
            }
        });

        const defenderEventNames = updatedPlayers
            .filter((player) => school.defenders.includes(player.id))
            .map((player) => getEventPlayerName(player));

        return {
            players: updatedPlayers,
            schools: updatedSchools,
            completedSchoolId: school.id,
            logEntries: [`${formatNameList(defenderEventNames)} saved ${getSchoolEventLabel(school)}!`],
        };
    }

    return {
        players: updatedPlayers,
        schools: updatedSchools,
        completedSchoolId: null,
        logEntries: [`${currentPlayerName} defends ${getSchoolEventLabel(school)}. Progress is now ${nextProgress}/3.`],
    };
}

export function resolveSilverWolfChallenge({
    currentPlayerIndex,
    getEventPlayerName,
    players,
    rollDie,
    schools,
}) {
    const updatedPlayers = clonePlayersSnapshot(players);
    const updatedSchools = cloneSchoolsSnapshot(schools);
    const challenger = updatedPlayers[currentPlayerIndex];

    if (!challenger || !canChallengeSilverWolf(challenger)) {
        return null;
    }

    const wolfStrength = getSilverWolfStrength(updatedSchools) + rollDie();
    const challengerStrength = buildCombatScore(challenger, { rollDie });
    const logEntries = [
        `${getEventPlayerName(challenger)} challenges the Silver Wolf with Power ${challenger.power}, Stamina ${challenger.stamina}, Agility ${challenger.agility}, Chi ${challenger.chi}, and Wit ${challenger.wit}.`,
    ];

    if (challengerStrength > wolfStrength) {
        logEntries.push(`${getEventPlayerName(challenger)} defeats the Silver Wolf in combat and wins Valley of the Silver Wolf.`);
        return {
            players: updatedPlayers,
            schools: updatedSchools,
            logEntries,
            winnerId: challenger.id,
            challengerDied: false,
        };
    }

    challenger.alive = false;
    logEntries.push(`The Silver Wolf kills ${getEventPlayerName(challenger)}. His kung fu was too strong.`);

    return {
        players: updatedPlayers,
        schools: updatedSchools,
        logEntries,
        winnerId: null,
        challengerDied: true,
    };
}

export function resolveAcceptedChallenge({
    actionsRemaining,
    challengerId,
    players,
}) {
    const shouldBankAction = actionsRemaining > 1;
    const updatedPlayers = shouldBankAction
        ? grantSingleUseActionForNextTurn(players, challengerId)
        : players;

    return {
        players: updatedPlayers,
        shouldBankAction,
    };
}

export function resolveDeclinedChallenge({
    actionsRemaining,
    challengerId,
    getEventPlayerName,
    players,
    targetId,
}) {
    const updatedPlayers = clonePlayersSnapshot(players);
    const declinedPlayer = updatedPlayers.find((player) => player.id === targetId);
    const challenger = updatedPlayers.find((player) => player.id === challengerId) || null;
    const target = updatedPlayers.find((player) => player.id === targetId) || null;
    const shouldBankAction = actionsRemaining > 1;

    if (declinedPlayer) {
        lowerReputation(declinedPlayer, 1);
    }

    const playersAfterBonus = shouldBankAction
        ? grantSingleUseActionForNextTurn(updatedPlayers, challengerId)
        : updatedPlayers;

    return {
        players: playersAfterBonus,
        shouldBankAction,
        logEntries: challenger && target
            ? [`${getEventPlayerName(target)} declines ${getEventPlayerName(challenger)}'s challenge and loses 1 Reputation.`]
            : [],
    };
}

export function resolveRollFateAction({
    actionsRemaining,
    currentPlayerId,
    players,
    rollQuestDie,
}) {
    const result = rollQuestDie();
    const shouldBankAction = actionsRemaining > 1;
    const updatedPlayers = shouldBankAction
        ? grantSingleUseActionForNextTurn(players, currentPlayerId)
        : players;

    return {
        players: updatedPlayers,
        pendingRoll: result,
        shouldBankAction,
    };
}

function formatNameList(names) {
    if (names.length <= 1) {
        return names[0] || "";
    }

    if (names.length === 2) {
        return `${names[0]} and ${names[1]}`;
    }

    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
