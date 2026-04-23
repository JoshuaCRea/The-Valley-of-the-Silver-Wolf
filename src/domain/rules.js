import {
    MAX_STAT,
    SCHOOL_STATUS_DESTROYED,
    SCHOOL_STATUS_SIEGED,
    SCHOOL_STATUS_WHOLE,
    SILVER_WOLF_BASE_STRENGTH,
    TOTAL_TO_CHALLENGE,
    WHITE_DIE_WOLF,
} from "./constants.js";

export function clampStat(value) {
    return Math.max(0, Math.min(MAX_STAT, value));
}

export function getAlivePlayers(players) {
    return players.filter((player) => player.alive);
}

export function getActionsForPlayer(player) {
    if (!player) {
        return 0;
    }

    const baseActions = player.injured ? 1 : 2;
    return baseActions + (player.bonusActionsNextTurn || 0);
}

export function consumeNextTurnActionBonus(players, playerIndex) {
    const player = players[playerIndex];
    const consumedBonusActions = player?.bonusActionsNextTurn || 0;

    if (!player || !player.bonusActionsNextTurn) {
        return {
            players,
            actions: getActionsForPlayer(player),
            consumedBonusActions,
        };
    }

    const updatedPlayers = players.map((entry, index) => (
        index === playerIndex
            ? {
                ...entry,
                bonusActionsNextTurn: 0,
            }
            : entry
    ));

    return {
        players: updatedPlayers,
        actions: getActionsForPlayer(player),
        consumedBonusActions,
    };
}

export function grantSingleUseActionForNextTurn(players, playerId) {
    return players.map((player) => (
        player.id === playerId
            ? {
                ...player,
                bonusActionsNextTurn: (player.bonusActionsNextTurn || 0) + 1,
            }
            : player
    ));
}

export function getNextLivingIndex(players, currentIndex) {
    for (let offset = 1; offset <= players.length; offset += 1) {
        const candidateIndex = (currentIndex + offset) % players.length;
        if (players[candidateIndex].alive) {
            return candidateIndex;
        }
    }

    return currentIndex;
}

export function changeStats(player, updates) {
    const tookDamage = Object.values(updates).some((value) => value < 0);

    Object.entries(updates).forEach(([key, value]) => {
        player[key] = clampStat(player[key] + value);
    });

    if (tookDamage) {
        player.injured = true;
    }
}

export function lowerReputation(player, amount = 1) {
    player.reputation = clampStat(player.reputation - amount);
}

export function raiseReputation(player, amount = 1) {
    player.reputation = clampStat(player.reputation + amount);
}

export function getSilverWolfStrength(schools) {
    const destroyedSchools = schools.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
    return SILVER_WOLF_BASE_STRENGTH + (destroyedSchools * 2);
}

export function canChallengeSilverWolf(player) {
    return player.alive && getTotalStats(player) >= TOTAL_TO_CHALLENGE;
}

export function getTotalStats(player) {
    return player.power + player.stamina + player.agility + player.chi + player.wit;
}

export function buildCombatScore(player, { rollDie }) {
    return player.power + player.stamina + player.agility + player.chi + player.wit + rollDie();
}

export function resolveRivalFight(players, activeIndex, logEntries, { rollDie, getPlayerDisplayName }) {
    const activePlayer = players[activeIndex];
    const rivals = players.filter((player, index) => (
        index !== activeIndex && player.alive && player.position === activePlayer.position
    ));

    if (rivals.length === 0) {
        return;
    }

    const rival = rivals[0];
    const activeScore = buildCombatScore(activePlayer, { rollDie });
    const rivalScore = buildCombatScore(rival, { rollDie });

    if (activeScore >= rivalScore) {
        changeStats(activePlayer, { wit: 1 });
        changeStats(rival, { stamina: -1, chi: -1 });
        logEntries.push(
            `${getPlayerDisplayName(activePlayer)} beats ${getPlayerDisplayName(rival)} in a fight and gains 1 Wit. ${getPlayerDisplayName(rival)} loses 1 Stamina and 1 Chi.`
        );
        return;
    }

    changeStats(rival, { wit: 1 });
    changeStats(activePlayer, { stamina: -1, chi: -1 });
    logEntries.push(
        `${getPlayerDisplayName(rival)} beats ${getPlayerDisplayName(activePlayer)} in a fight. ${getPlayerDisplayName(activePlayer)} loses 1 Stamina and 1 Chi.`
    );
}

export function getRivalsAtPosition(players, activeIndex) {
    const activePlayer = players[activeIndex];

    if (!activePlayer?.alive) {
        return [];
    }

    return players.filter((player, index) => (
        index !== activeIndex && player.alive && player.position === activePlayer.position
    ));
}

export function getSchoolById(schools, schoolId) {
    return schools.find((school) => school.id === schoolId) || null;
}

export function getSchoolByName(schools, schoolName) {
    return schools.find((school) => school.name === schoolName) || null;
}

export function advanceSilverWolf(
    schools,
    logEntries,
    {
        chooseIndex,
        getSchoolEventLabel,
        rollWhiteDie,
    }
) {
    const standingSchools = schools.filter((school) => school.status !== SCHOOL_STATUS_DESTROYED);
    const siegedSchool = standingSchools.find((school) => school.status === SCHOOL_STATUS_SIEGED && !school.isCompletingSave) || null;
    const wholeSchools = standingSchools.filter((school) => school.status === SCHOOL_STATUS_WHOLE && !school.isCompletingSave);

    if (standingSchools.length === 0) {
        return false;
    }

    const whiteDieResult = rollWhiteDie();

    if (siegedSchool) {
        const selectedSchool = standingSchools[chooseIndex(standingSchools.length)];

        if (selectedSchool.id !== siegedSchool.id) {
            return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
        }

        if (whiteDieResult === WHITE_DIE_WOLF) {
            siegedSchool.status = SCHOOL_STATUS_DESTROYED;
            siegedSchool.saveProgress = 0;
            siegedSchool.isCompletingSave = false;
            siegedSchool.defenders = [];
            logEntries.push(`The Silver Wolf has destroyed ${getSchoolEventLabel(siegedSchool)}.`);
        }
        return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
    }

    if (wholeSchools.length === 0) {
        return false;
    }

    const target = wholeSchools[chooseIndex(wholeSchools.length)];

    if (whiteDieResult === WHITE_DIE_WOLF) {
        target.status = SCHOOL_STATUS_SIEGED;
        target.saveProgress = 0;
        target.isCompletingSave = false;
        target.defenders = [];
        logEntries.push(`The Silver Wolf has laid siege to ${getSchoolEventLabel(target)}.`);
    }

    return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
}
