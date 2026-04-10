import {
    CCW_DIR_VALUE,
    CW_DIR_VALUE,
    TRACK_DETAILS,
    createPlayers,
    getFighterStatusFace,
    getSchoolSigil,
    getTownCopy,
    normalizeIndex,
} from "./gameData.js";

const React = window.React;
const ReactDOM = window.ReactDOM;
const MAX_STAT = 5;
const SCHOOL_STATUS_WHOLE = "whole";
const SCHOOL_STATUS_SIEGED = "sieged";
const SCHOOL_STATUS_DESTROYED = "destroyed";
const WHITE_DIE_WOLF = 1;
const SILVER_WOLF_BASE_STRENGTH = 20;
const TOTAL_TO_CHALLENGE = 15;
const TRAVEL_ARROWS_ICON = new URL("./images/arrows-couple-svgrepo-com.svg", import.meta.url).href;
const DEFEND_ICON = new URL("./images/defend-icon.svg", import.meta.url).href;
const FIRE_ICON = new URL("./images/fire-svgrepo-com.svg", import.meta.url).href;
const HEAL_ICON = new URL("./images/medicine-pharmacy-svgrepo-com.svg", import.meta.url).href;
const QUEST_ICON = new URL("./images/business-card-svgrepo-com.svg", import.meta.url).href;
const MOUNTAIN_ICON = new URL("./images/mountain-1-svgrepo-com.svg", import.meta.url).href;
const CHINESE_KNOT_ICON = new URL("./images/chinese-knot-svgrepo-com.svg", import.meta.url).href;
const MODAL_BACKGROUND = new URL("./images/modal-background.jpeg", import.meta.url).href;
const TOWN_STAR_POSITIONS = [
    { x: "50%", y: "0%" },
    { x: "106%", y: "40%" },
    { x: "88%", y: "110%" },
    { x: "12%", y: "110%" },
    { x: "-6%", y: "40%" },
];
const HOMETOWN_MODAL_POSITIONS = [
    { x: "50%", y: "16%" },
    { x: "74%", y: "37%" },
    { x: "64%", y: "68%" },
    { x: "36%", y: "68%" },
    { x: "26%", y: "37%" },
];
const ROAD_STAR_POSITIONS = [
    { x: "50%", y: "18%" },
    { x: "78%", y: "38%" },
    { x: "66%", y: "74%" },
    { x: "34%", y: "74%" },
    { x: "22%", y: "38%" },
];
const COMBAT_PHASES = [
    {
        id: "selection",
        title: "Selection Phase",
        copy: "Each combatant chooses one combat card and declares which modal option will be used for this clash.",
    },
    {
        id: "reveal",
        title: "Reveal Step",
        copy: "Both cards are revealed simultaneously. If a stone would be placed in the tabletop version, deduct a Form Point here instead.",
    },
    {
        id: "reaction",
        title: "Reaction Phase",
        copy: "Resolve reactions, technique responses, White Die effects for non-player adversaries, and any Stumble changes.",
    },
    {
        id: "calculation",
        title: "Calculation Step",
        copy: "Compare the attack and defense arrays, then subtract any resulting Hit Points.",
    },
    {
        id: "activation",
        title: "Activation Phase",
        copy: "Queue up to one technique per fighter for the next clash before beginning again.",
    },
];
const RULE_SECTIONS = [
    {
        title: "Protect the valley",
        points: [
            "Guard the five schools while building a fighter strong enough to face the Silver Wolf.",
            `A fighter can challenge the Silver Wolf once their total Power, Stamina, Agility, Chi, and Wit reaches ${TOTAL_TO_CHALLENGE} or more.`,
        ],
    },
    {
        title: "Take your turn",
        points: [
            "Each active fighter gets 2 actions on their turn, or 1 action if they are Injured.",
            "Travel, challenge a rival, heal in a town, defend a sieged school, or pass the turn to advance the round.",
            "At the end of a turn, the Silver Wolf advances and the danger in the valley grows.",
        ],
    },
    {
        title: "Save the schools",
        points: [
            "A sieged school needs 3 total defend actions to be saved.",
            "When a school is destroyed, every fighter loses Reputation, and any healthy fighter caught there becomes Injured.",
            "If all five schools are destroyed, the game is lost.",
        ],
    },
    {
        title: "Fight your rivals",
        points: [
            "If rivals share a location, the active fighter can issue a challenge.",
            "Combat runs through selection, reveal, reaction, calculation, and activation phases.",
            "The winner gains 1 Reputation and a bonus action next turn. The loser becomes Injured and loses 1 Reputation.",
        ],
    },
    {
        title: "Defeat the Silver Wolf",
        points: [
            "Winning the final challenge wins the game.",
            "Failing that challenge kills the fighter who attempted it.",
            "If every challenger dies, the Silver Wolf remains undefeated.",
        ],
    },
];
const PLAYER_STARTING_STATS = {
    Pouch: { power: 0, stamina: 1, agility: 0, chi: 0, wit: 2 },
    "Leap-Creek": { power: 0, stamina: 0, agility: 1, chi: 2, wit: 0 },
    Fangmarsh: { power: 2, stamina: 0, agility: 0, chi: 0, wit: 1 },
    Blackstone: { power: 1, stamina: 2, agility: 0, chi: 0, wit: 0 },
    Underclaw: { power: 0, stamina: 0, agility: 2, chi: 1, wit: 0 },
};

function createInitialPlayers() {
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

function createSchools() {
    return TRACK_DETAILS.filter((location) => location.type === "town").map((location) => ({
        id: location.id,
        name: location.name,
        status: SCHOOL_STATUS_WHOLE,
        saveProgress: 0,
        isCompletingSave: false,
        defenders: [],
    }));
}

function getPlayerNumber(player) {
    if (!player?.id) {
        return null;
    }

    const numericId = String(player.id).match(/^p(\d+)$/i);
    return numericId ? numericId[1] : null;
}

function getPlayerDisplayName(player) {
    const playerNumber = getPlayerNumber(player);
    return playerNumber ? `Player ${playerNumber}` : "Player";
}

function getPlayerCurrentLocationName(player) {
    if (!player) {
        return "Unknown";
    }

    const currentLocation = TRACK_DETAILS[player.position];
    return currentLocation?.name || "Unknown";
}

function getTrackStyle(index, color) {
    return {
        "--angle": `${(360 / TRACK_DETAILS.length) * index}deg`,
        "--node-color": color,
    };
}

function clampStat(value) {
    return Math.max(0, Math.min(MAX_STAT, value));
}

function randomDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollWhiteDie() {
    return randomDie();
}

function getTotalStats(player) {
    return player.power + player.stamina + player.agility + player.chi + player.wit;
}

function isTown(locationId) {
    return locationId.startsWith("#") && !locationId.startsWith("#road");
}

function getSchoolById(schools, schoolId) {
    return schools.find((school) => school.id === schoolId) || null;
}

function getSchoolByName(schools, schoolName) {
    return schools.find((school) => school.name === schoolName) || null;
}

function getSchoolEventLabel(school) {
    const townCopy = getTownCopy(school.id);
    return `the ${townCopy.school} in ${school.name}`;
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

function getAlivePlayers(players) {
    return players.filter((player) => player.alive);
}

function getActionsForPlayer(player) {
    if (!player) {
        return 0;
    }

    const baseActions = player.injured ? 1 : 2;
    return baseActions + (player.bonusActionsNextTurn || 0);
}

function consumeNextTurnActionBonus(players, playerIndex) {
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

function grantSingleUseActionForNextTurn(players, playerId) {
    return players.map((player) => (
        player.id === playerId
            ? {
                ...player,
                bonusActionsNextTurn: (player.bonusActionsNextTurn || 0) + 1,
            }
            : player
    ));
}

function getNextLivingIndex(players, currentIndex) {
    for (let offset = 1; offset <= players.length; offset += 1) {
        const candidateIndex = (currentIndex + offset) % players.length;
        if (players[candidateIndex].alive) {
            return candidateIndex;
        }
    }

    return currentIndex;
}

function changeStats(player, updates) {
    const tookDamage = Object.values(updates).some((value) => value < 0);

    Object.entries(updates).forEach(([key, value]) => {
        player[key] = clampStat(player[key] + value);
    });

    if (tookDamage) {
        player.injured = true;
    }
}

function lowerReputation(player, amount = 1) {
    player.reputation = clampStat(player.reputation - amount);
}

function raiseReputation(player, amount = 1) {
    player.reputation = clampStat(player.reputation + amount);
}

function getSilverWolfStrength(schools) {
    const destroyedSchools = schools.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
    return SILVER_WOLF_BASE_STRENGTH + (destroyedSchools * 2);
}

function canChallengeSilverWolf(player) {
    return player.alive && getTotalStats(player) >= TOTAL_TO_CHALLENGE;
}

function buildCombatScore(player) {
    return player.power + player.stamina + player.agility + player.chi + player.wit + randomDie();
}

function resolveRivalFight(players, activeIndex, logEntries) {
    const activePlayer = players[activeIndex];
    const rivals = players.filter((player, index) => (
        index !== activeIndex && player.alive && player.position === activePlayer.position
    ));

    if (rivals.length === 0) {
        return;
    }

    const rival = rivals[0];
    const activeScore = buildCombatScore(activePlayer);
    const rivalScore = buildCombatScore(rival);

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

function getRivalsAtPosition(players, activeIndex) {
    const activePlayer = players[activeIndex];

    if (!activePlayer?.alive) {
        return [];
    }

    return players.filter((player, index) => (
        index !== activeIndex && player.alive && player.position === activePlayer.position
    ));
}

function advanceSilverWolf(schools, logEntries) {
    const standingSchools = schools.filter((school) => school.status !== SCHOOL_STATUS_DESTROYED);
    const siegedSchool = standingSchools.find((school) => school.status === SCHOOL_STATUS_SIEGED && !school.isCompletingSave) || null;
    const wholeSchools = standingSchools.filter((school) => school.status === SCHOOL_STATUS_WHOLE && !school.isCompletingSave);

    if (standingSchools.length === 0) {
        return false;
    }

    const whiteDieResult = rollWhiteDie();

    if (siegedSchool) {
        const selectedSchool = standingSchools[Math.floor(Math.random() * standingSchools.length)];

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

    const target = wholeSchools[Math.floor(Math.random() * wholeSchools.length)];

    if (whiteDieResult === WHITE_DIE_WOLF) {
        target.status = SCHOOL_STATUS_SIEGED;
        target.saveProgress = 0;
        target.isCompletingSave = false;
        target.defenders = [];
        logEntries.push(`The Silver Wolf has laid siege to ${getSchoolEventLabel(target)}.`);
    }

    return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
}

function StatPill({ label, value }) {
    const labelClassName = `practice-stat-label${label === "Stamina" ? " is-stamina" : ""}`;

    return React.createElement(
        "div",
        { className: "practice-stat-pill" },
        React.createElement("span", { className: labelClassName }, label),
        React.createElement("strong", null, value)
    );
}

const FIGHTER_STYLE_COPY = {
    "Leap-Creek": {
        style: "Boundless Hand",
        keyword: "Reversal",
    },
    Fangmarsh: {
        style: "Praying Mantis",
        keyword: "Flurry",
    },
    Blackstone: {
        style: "Immense Fist",
        keyword: "Endure",
    },
    Underclaw: {
        style: "Long Fist",
        keyword: "Overwhelm",
    },
    Pouch: {
        style: "Drunken Fist",
        keyword: "Stumble",
    },
};

function FighterProfileCard({ player }) {
    const townCopy = getTownCopy(`#${player.name}`);
    const currentMapLocation = TRACK_DETAILS[player.position] || null;
    const locationStatusNode = currentMapLocation
        ? (
            currentMapLocation.type === "town"
                ? React.createElement(
                    React.Fragment,
                    null,
                    "in ",
                    React.createElement(
                        "span",
                        {
                            className: "practice-fighter-profile-location-city",
                            style: { "--location-city-color": currentMapLocation.hue },
                        },
                        `${currentMapLocation.name}.`
                    )
                )
                : "on the road."
        )
        : "on the road.";
    const sigilSrc = getSchoolSigil(player.name);
    const healthStatus = player.alive ? (player.injured ? "injured" : "healthy") : "dead";
    const healthFaceSrc = getFighterStatusFace(healthStatus);
    const healthLabel = player.alive
        ? (player.injured ? "You are Injured" : "You are Healthy")
        : "You are Dead";
    const schoolLabel = townCopy.school.startsWith("The ") ? townCopy.school : `The ${townCopy.school}`;
    const schoolLabelMatch = schoolLabel.match(/^(The\s+(?:Temple|School|Kwoon)\s+of)\s+(.+)$/i);
    const schoolLabelTop = schoolLabelMatch ? schoolLabelMatch[1] : schoolLabel;
    const schoolLabelBottom = schoolLabelMatch ? schoolLabelMatch[2] : "";
    const styleCopy = FIGHTER_STYLE_COPY[player.name] || { style: "TBD", keyword: "TBD" };
    const styleLineClassName = `practice-fighter-profile-style-line${styleCopy.style.length > 12 ? " is-long" : ""}`;

    return React.createElement(
        "div",
        { className: "practice-fighter-profile" },
        React.createElement(
            "div",
            { className: "practice-fighter-profile-top" },
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-copy" },
                    React.createElement("p", { className: "practice-fighter-profile-kicker" }, "You are the Light of"),
                    React.createElement("h2", {
                        className: `practice-fighter-profile-city-name${player.alive ? "" : " is-dead"}`,
                        style: { "--fighter-city-color": player.color },
                    }, player.name),
                    React.createElement(
                        "div",
                        { className: "practice-fighter-profile-school" },
                        React.createElement("p", { className: "practice-fighter-profile-school-line" }, schoolLabelTop),
                        schoolLabelBottom
                            ? React.createElement("p", { className: "practice-fighter-profile-school-line" }, schoolLabelBottom)
                        : null
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-style" },
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-style-block" },
                    React.createElement("p", { className: "practice-fighter-profile-style-label" }, "Style"),
                    React.createElement("p", { className: styleLineClassName }, styleCopy.style)
                ),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-style-block" },
                    React.createElement("p", { className: "practice-fighter-profile-style-label" }, "Keyword"),
                    React.createElement("p", { className: "practice-fighter-profile-style-line" }, styleCopy.keyword)
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-sigil-block" },
                sigilSrc
                    ? React.createElement("img", {
                        className: "practice-fighter-profile-sigil",
                        src: sigilSrc,
                        alt: `${player.name} sigil`,
                    })
                    : null,
                React.createElement(
                    "p",
                    { className: "practice-fighter-profile-nickname" },
                    `"${townCopy.description}"`
                )
            )
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-stats" },
            React.createElement(StatPill, { label: "Power", value: player.power }),
            React.createElement(StatPill, { label: "Stamina", value: player.stamina }),
            React.createElement(StatPill, { label: "Agility", value: player.agility }),
            React.createElement(StatPill, { label: "Chi", value: player.chi }),
            React.createElement(StatPill, { label: "Wit", value: player.wit })
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-bottom" },
            React.createElement(
                "div",
                { className: "practice-fighter-profile-health" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Health"),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-health-row" },
                    React.createElement("img", {
                        className: "practice-fighter-profile-face",
                        src: healthFaceSrc,
                        alt: healthLabel,
                    })
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-techniques" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Techniques"),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-techniques-row", "aria-label": "Techniques" },
                    React.createElement("button", { className: "practice-technique-button is-black", type: "button" }, player.techniques?.black ?? 0),
                    React.createElement("button", { className: "practice-technique-button is-brown", type: "button" }, player.techniques?.brown ?? 0),
                    React.createElement("button", { className: "practice-technique-button is-gold", type: "button" }, player.techniques?.gold ?? 0)
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-reputation" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Reputation"),
                React.createElement(
                    "div",
                    {
                        className: "practice-roster-bar-indicator",
                        style: { "--reputation-position": player.reputation },
                        "aria-label": `Reputation ${player.reputation} of 5`,
                    },
                    React.createElement(
                        "div",
                        { className: "practice-roster-bar", "aria-hidden": "true" },
                        React.createElement("span", { className: "practice-roster-bar-segment is-black" }),
                        React.createElement("span", { className: "practice-roster-bar-segment is-black" }),
                        React.createElement("span", { className: "practice-roster-bar-segment is-brown" }),
                        React.createElement("span", { className: "practice-roster-bar-segment is-brown" }),
                        React.createElement("span", { className: "practice-roster-bar-segment is-gold" })
                    ),
                    React.createElement("span", { className: "practice-roster-bar-pointer" })
                )
            )
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-point-sections" },
            React.createElement(
                "div",
                { className: "practice-fighter-profile-point-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Hit Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Hit Points ${player.hitPoints ?? 0} of 6` },
                    Array.from({ length: 6 }).map((_, index) =>
                        React.createElement("span", {
                            key: `hit-point-${player.id}-${index}`,
                            className: `practice-hit-point${index < (player.hitPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-point-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Form Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row is-character-sheet-form-points", "aria-label": `Form Points ${player.formPoints ?? 0} of 5` },
                    Array.from({ length: 5 }).map((_, index) =>
                        React.createElement("img", {
                            key: `form-point-${player.id}-${index}`,
                            className: `practice-form-knot${index < (player.formPoints ?? 0) ? " is-filled" : ""}`,
                            src: CHINESE_KNOT_ICON,
                            alt: "",
                            "aria-hidden": "true",
                        })
                    )
                )
            )
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-support-row" },
            React.createElement(
                "div",
                { className: "practice-fighter-profile-location-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Currently you are:"),
                React.createElement("p", { className: "practice-fighter-profile-location-copy" }, locationStatusNode)
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-location-section practice-fighter-profile-support-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Companion"),
                React.createElement("p", { className: "practice-fighter-profile-location-copy" }, "None.")
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-location-section practice-fighter-profile-support-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Item"),
                React.createElement("p", { className: "practice-fighter-profile-location-copy" }, "None.")
            )
        )
    );
}

function CityNameWordmark({ name, color, isDead }) {
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const clipPathId = `city-name-clip-${slug}`;
    const shadowFilterId = `city-name-shadow-${slug}`;

    return React.createElement(
        "h2",
        { className: `practice-fighter-profile-city-name${isDead ? " is-dead" : ""}` },
        React.createElement(
            "svg",
            {
                className: "practice-fighter-profile-city-wordmark",
                viewBox: "0 0 360 64",
                preserveAspectRatio: "xMinYMid meet",
                role: "img",
                "aria-label": name,
            },
            React.createElement(
                "defs",
                null,
                React.createElement(
                    "clipPath",
                    { id: clipPathId },
                    React.createElement("text", {
                        x: "0",
                        y: "42",
                        textAnchor: "start",
                        className: "practice-fighter-profile-city-svg-text",
                    }, name)
                ),
                React.createElement(
                    "filter",
                    {
                        id: shadowFilterId,
                        x: "-20%",
                        y: "-20%",
                        width: "140%",
                        height: "160%",
                    },
                    React.createElement("feDropShadow", {
                        dx: "0",
                        dy: "3",
                        stdDeviation: "3",
                        floodColor: "#000000",
                        floodOpacity: "0.35",
                    })
                )
            ),
            React.createElement("text", {
                x: "0",
                y: "42",
                textAnchor: "start",
                className: "practice-fighter-profile-city-svg-text practice-fighter-profile-city-svg-stroke",
                style: {
                    fill: color,
                    stroke: "#f7f7f4",
                    clipPath: `url(#${clipPathId})`,
                    filter: `url(#${shadowFilterId})`,
                },
            }, name),
            React.createElement("text", {
                x: "0",
                y: "42",
                textAnchor: "start",
                className: "practice-fighter-profile-city-svg-text",
                style: {
                    fill: color,
                    filter: `url(#${shadowFilterId})`,
                },
            }, name)
        )
    );
}

function HometownSelectionModal({ players, onChoose, isClosing }) {
    return React.createElement(
        "div",
        { className: `practice-modal-backdrop${isClosing ? " is-closing" : ""}`, role: "presentation" },
        React.createElement(
            "div",
            {
                className: "practice-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-hometown-title",
                style: { "--modal-background-image": `url("${MODAL_BACKGROUND}")` },
            },
            React.createElement("p", { className: "practice-modal-kicker" }, "Choose Your Home"),
            React.createElement("h2", { id: "practice-hometown-title" }, "Where Are You From?"),
            React.createElement(
                "div",
                { className: "practice-modal-star" },
                players.map((player, index) => {
                    const displayName = getPlayerDisplayName(player);
                    const townCopy = getTownCopy(`#${player.name}`);
                    const styleCopy = FIGHTER_STYLE_COPY[player.name] || { style: "TBD", keyword: "TBD" };
                    const sigilSrc = getSchoolSigil(player.name);
                    const schoolLabel = townCopy.school.startsWith("The ") ? townCopy.school : `The ${townCopy.school}`;
                    const schoolClassName = `practice-hometown-option-school${player.name === "Fangmarsh" || player.name === "Leap-Creek" ? " is-compact" : ""}`;

                    return React.createElement(
                        "button",
                        {
                            key: `hometown-${player.id}`,
                            className: "practice-hometown-option",
                            type: "button",
                            disabled: isClosing,
                            onClick: () => onChoose(player.id),
                            style: {
                                left: HOMETOWN_MODAL_POSITIONS[index].x,
                                top: HOMETOWN_MODAL_POSITIONS[index].y,
                                "--hometown-accent": player.color,
                            },
                        },
                        sigilSrc
                            ? React.createElement("img", {
                                className: "practice-hometown-option-sigil",
                                src: sigilSrc,
                                alt: "",
                                "aria-hidden": "true",
                            })
                            : null,
                        React.createElement("p", { className: "practice-hometown-option-city" }, displayName),
                        React.createElement("p", { className: "practice-hometown-option-nickname" }, `"${townCopy.description}"`),
                        React.createElement("p", { className: schoolClassName }, schoolLabel),
                        React.createElement("p", { className: "practice-hometown-option-style" }, styleCopy.style),
                        React.createElement("p", { className: "practice-hometown-option-keyword" }, `Keyword: ${styleCopy.keyword}`)
                    );
                })
            )
        )
    );
}

function RulesModal({ onClose }) {
    return React.createElement(
        "div",
        {
            className: "practice-modal-backdrop practice-rules-backdrop",
            role: "presentation",
        },
        React.createElement(
            "div",
            {
                className: "practice-modal practice-rules-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-rules-title",
                style: { "--modal-background-image": `url("${MODAL_BACKGROUND}")` },
            },
            React.createElement("p", { className: "practice-modal-kicker" }, "Game Guide"),
            React.createElement("h2", { id: "practice-rules-title" }, "Welcome to Star Valley!"),
            React.createElement(
                "button",
                {
                    className: "practice-modal-close",
                    type: "button",
                    onClick: onClose,
                    "aria-label": "Close rules dialog",
                },
                "Close"
            ),
            React.createElement(
                "div",
                { className: "practice-rules-scroll" },
                React.createElement(
                    "p",
                    { className: "practice-rules-intro" },
                    "Lead one of the valley's fighters, defend the schools, and prepare for the final battle with the Silver Wolf."
                ),
                React.createElement(
                    "div",
                    { className: "practice-rules-grid" },
                    RULE_SECTIONS.map((section) => React.createElement(
                        "section",
                        {
                            key: section.title,
                            className: "practice-rules-section",
                        },
                        React.createElement("h3", null, section.title),
                        React.createElement(
                            "ul",
                            null,
                            section.points.map((point) => React.createElement("li", { key: point }, point))
                        )
                    ))
                )
            )
        )
    );
}

function CombatantSummary({ fighter, toneClassName }) {
    return React.createElement(
        "article",
        { className: `practice-combatant-card ${toneClassName}` },
        React.createElement("p", { className: "practice-combatant-kicker" }, "Combatant"),
        React.createElement("h3", null, fighter.displayName || fighter.name),
        fighter.hometownName
            ? React.createElement("p", { className: "practice-combat-phase-copy" }, fighter.hometownName)
            : null,
        React.createElement(
            "div",
            { className: "practice-combatant-resource-grid" },
            React.createElement(
                "div",
                { className: "practice-combatant-resource" },
                React.createElement("p", { className: "practice-combatant-resource-label" }, "Hit Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Hit Points ${fighter.currentHitPoints ?? 0} of ${fighter.maxHitPoints ?? 0}` },
                    Array.from({ length: fighter.maxHitPoints ?? 0 }).map((_, index) =>
                        React.createElement("span", {
                            key: `combat-hit-${fighter.id}-${index}`,
                            className: `practice-hit-point${index < (fighter.currentHitPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-combatant-resource" },
                React.createElement("p", { className: "practice-combatant-resource-label" }, "Form Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Form Points ${fighter.currentFormPoints ?? 0} of ${fighter.maxFormPoints ?? 0}` },
                    Array.from({ length: fighter.maxFormPoints ?? 0 }).map((_, index) =>
                        React.createElement("span", {
                            key: `combat-form-${fighter.id}-${index}`,
                            className: `practice-form-point${index < (fighter.currentFormPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            )
        )
    );
}

const COMBAT_LANES = ["high", "middle", "low"];
const COMBAT_LANE_LABELS = {
    high: "High",
    middle: "Middle",
    low: "Low",
};
const COMBAT_MODE_NORMAL = "normal";
const COMBAT_MODE_KEYWORD = "keyword";
const COMBAT_MODE_SWAP_ATTACK = "swap-attack";
const COMBAT_MODE_SWAP_DEFENSE = "swap-defense";
const BASE_COMBAT_DECK_CARDS = [
    { id: "shared-hh", attack: "high", defense: "high", swapLane: "middle", isSpecial: false, title: "High Wall" },
    { id: "shared-hm", attack: "high", defense: "middle", swapLane: "low", isSpecial: false, title: "Rising Split" },
    { id: "shared-hl", attack: "high", defense: "low", swapLane: "middle", isSpecial: false, title: "Sky Hook" },
    { id: "shared-mh", attack: "middle", defense: "high", swapLane: "low", isSpecial: false, title: "Center Break" },
    { id: "shared-mm", attack: "middle", defense: "middle", swapLane: "high", isSpecial: false, title: "Mirror Gate" },
    { id: "shared-ml", attack: "middle", defense: "low", swapLane: "high", isSpecial: false, title: "Cross Step" },
    { id: "shared-lh", attack: "low", defense: "high", swapLane: "middle", isSpecial: false, title: "Shin Sweep" },
    { id: "shared-lm", attack: "low", defense: "middle", swapLane: "high", isSpecial: false, title: "River Cut" },
    { id: "shared-ll", attack: "low", defense: "low", swapLane: "middle", isSpecial: false, title: "Rooted Hook" },
];
const COMBAT_DECK_LIBRARY = {
    "Leap-Creek": BASE_COMBAT_DECK_CARDS.concat({
        id: "special-mm-leap-creek",
        attack: "middle",
        defense: "middle",
        swapLane: "low",
        isSpecial: true,
        title: "Hidden Whirlpool",
    }),
    Fangmarsh: BASE_COMBAT_DECK_CARDS.concat({
        id: "special-mm-fangmarsh",
        attack: "middle",
        defense: "middle",
        swapLane: "low",
        isSpecial: true,
        title: "Billowing Rush",
    }),
    Blackstone: BASE_COMBAT_DECK_CARDS.concat({
        id: "special-mm-blackstone",
        attack: "middle",
        defense: "middle",
        swapLane: "low",
        isSpecial: true,
        title: "Tempered Veil",
    }),
    Underclaw: BASE_COMBAT_DECK_CARDS.concat({
        id: "special-mm-underclaw",
        attack: "middle",
        defense: "middle",
        swapLane: "low",
        isSpecial: true,
        title: "Smothering Soil",
    }),
    Pouch: BASE_COMBAT_DECK_CARDS.concat({
        id: "special-mm-pouch",
        attack: "middle",
        defense: "middle",
        swapLane: "low",
        isSpecial: true,
        title: "Splintered Step",
    }),
};

function formatCombatLane(lane) {
    return COMBAT_LANE_LABELS[lane] || lane;
}

function describeLaneSet(lanes) {
    return lanes.map((lane) => formatCombatLane(lane)).join(" / ");
}

function shuffleArray(items) {
    const result = items.slice();

    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
}

function createCombatDeckForPlayer(player) {
    const keyword = FIGHTER_STYLE_COPY[player.name]?.keyword || "Keyword";
    const deck = COMBAT_DECK_LIBRARY[player.name] || COMBAT_DECK_LIBRARY.Pouch;

    return deck.map((card, index) => ({
        ...card,
        deckIndex: index,
        keyword,
        name: card.title,
        laneLabel: `${formatCombatLane(card.attack)} / ${formatCombatLane(card.defense)}`,
    }));
}

function drawCombatCards(drawPile, amount) {
    return {
        drawnCards: drawPile.slice(0, amount),
        remainingDrawPile: drawPile.slice(amount),
    };
}

function createCombatantState(player) {
    const shuffledDeck = shuffleArray(createCombatDeckForPlayer(player));
    const openingDraw = drawCombatCards(shuffledDeck, 5);

    return {
        id: player.id,
        name: getPlayerDisplayName(player),
        displayName: getPlayerDisplayName(player),
        hometownName: player.name,
        keyword: FIGHTER_STYLE_COPY[player.name]?.keyword || "Keyword",
        maxHitPoints: player.hitPoints ?? 3,
        currentHitPoints: player.hitPoints ?? 3,
        maxFormPoints: player.formPoints ?? 2,
        currentFormPoints: player.formPoints ?? 2,
        drawPile: openingDraw.remainingDrawPile,
        hand: openingDraw.drawnCards,
        discard: [],
        selectedCardId: null,
        selectedMode: null,
        effectiveCardId: null,
        stumbleTriggered: false,
        reactionLocked: false,
    };
}

function startCombatEncounter(players, attackerId, defenderId) {
    const attacker = players.find((player) => player.id === attackerId);
    const defender = players.find((player) => player.id === defenderId);

    if (!attacker || !defender) {
        return null;
    }

    return {
        attackerId,
        defenderId,
        clashNumber: 1,
        phaseIndex: 0,
        clashLog: [],
        combatants: {
            [attackerId]: createCombatantState(attacker),
            [defenderId]: createCombatantState(defender),
        },
    };
}

function getCombatCardById(combatant, cardId) {
    return combatant.hand.find((card) => card.id === cardId)
        || combatant.discard.find((card) => card.id === cardId)
        || combatant.drawPile.find((card) => card.id === cardId)
        || null;
}

function getEffectiveCardForCombatant(combatant) {
    const card = getCombatCardById(combatant, combatant.effectiveCardId || combatant.selectedCardId);

    if (!card) {
        return null;
    }

    const keywordActive = card.isSpecial || combatant.selectedMode === COMBAT_MODE_KEYWORD;
    const attackLanes = [card.attack];
    const defenseLanes = [card.defense];

    if (keywordActive && combatant.keyword === "Flurry") {
        attackLanes.push(card.swapLane);
    }

    if (keywordActive && combatant.keyword === "Endure") {
        defenseLanes.push(card.swapLane);
    }

    if (combatant.selectedMode === COMBAT_MODE_SWAP_ATTACK) {
        attackLanes.splice(0, attackLanes.length, card.swapLane);
    }

    if (combatant.selectedMode === COMBAT_MODE_SWAP_DEFENSE) {
        defenseLanes.splice(0, defenseLanes.length, card.swapLane);
    }

    return {
        card,
        attackLanes,
        defenseLanes,
        keywordActive,
        keyword: combatant.keyword,
        ignoresIncomingAttack: keywordActive && combatant.keyword === "Overwhelm",
        grantsReversal: keywordActive && combatant.keyword === "Reversal",
        allowsReactionStumble: keywordActive && combatant.keyword === "Stumble",
    };
}

function getModeCost(card, mode) {
    if (!mode) {
        return 0;
    }

    if (card.isSpecial) {
        if (mode === COMBAT_MODE_SWAP_ATTACK || mode === COMBAT_MODE_SWAP_DEFENSE) {
            return 1;
        }
        return 0;
    }

    if (mode === COMBAT_MODE_NORMAL) {
        return 0;
    }

    return 1;
}

function getAvailableModes(card) {
    if (card.isSpecial) {
        return [
            { id: COMBAT_MODE_NORMAL, label: "Keyword Active", copy: "Keyword is always on for this card.", cost: 0 },
            { id: COMBAT_MODE_SWAP_ATTACK, label: "Swap Attack", copy: `Replace attack with ${formatCombatLane(card.swapLane)}.`, cost: 1 },
            { id: COMBAT_MODE_SWAP_DEFENSE, label: "Swap Defense", copy: `Replace defense with ${formatCombatLane(card.swapLane)}.`, cost: 1 },
        ];
    }

    return [
        { id: COMBAT_MODE_KEYWORD, label: "School Special", copy: "Use this fighter's keyword.", cost: 1 },
        { id: COMBAT_MODE_SWAP_ATTACK, label: "Swap Attack", copy: `Replace attack with ${formatCombatLane(card.swapLane)}.`, cost: 1 },
        { id: COMBAT_MODE_SWAP_DEFENSE, label: "Swap Defense", copy: `Replace defense with ${formatCombatLane(card.swapLane)}.`, cost: 1 },
    ];
}

function resolveAttackAgainstDefender(attackerConfig, defenderConfig) {
    if (defenderConfig.ignoresIncomingAttack) {
        return { hits: 0, blocks: 0, ignored: attackerConfig.attackLanes.length };
    }

    return attackerConfig.attackLanes.reduce((result, lane) => {
        if (defenderConfig.defenseLanes.includes(lane)) {
            result.blocks += 1;
        } else {
            result.hits += 1;
        }
        return result;
    }, { hits: 0, blocks: 0, ignored: 0 });
}

function settleCombatCardUse(combatant) {
    const consumedCardId = combatant.effectiveCardId || combatant.selectedCardId;
    const consumedCard = getCombatCardById(combatant, consumedCardId);
    const currentHand = combatant.hand.filter((card) => card.id !== consumedCardId);
    let nextDrawPile = combatant.drawPile.slice();
    let nextDiscard = combatant.discard.concat(consumedCard ? [consumedCard] : []);
    let replenishedHand = currentHand.slice();

    if (replenishedHand.length === 0) {
        if (nextDrawPile.length === 0 && nextDiscard.length > 0) {
            const reshuffledDeck = shuffleArray(nextDiscard);
            const redraw = drawCombatCards(reshuffledDeck, Math.min(5, reshuffledDeck.length));
            replenishedHand = redraw.drawnCards;
            nextDrawPile = redraw.remainingDrawPile;
            nextDiscard = [];
        } else if (nextDrawPile.length > 0) {
            const redraw = drawCombatCards(nextDrawPile, Math.min(5, nextDrawPile.length));
            replenishedHand = redraw.drawnCards;
            nextDrawPile = redraw.remainingDrawPile;
        }
    }

    return {
        ...combatant,
        hand: replenishedHand,
        drawPile: nextDrawPile,
        discard: nextDiscard,
        selectedCardId: null,
        selectedMode: null,
        effectiveCardId: null,
        stumbleTriggered: false,
        reactionLocked: false,
    };
}

function CombatCardFace({
    card,
    fighter,
    effectiveConfig = null,
    isSelected = false,
    isButton = false,
}) {
    const attackLanes = effectiveConfig?.attackLanes || [card.attack];
    const defenseLanes = effectiveConfig?.defenseLanes || [card.defense];
    const keywordActive = Boolean(effectiveConfig?.keywordActive || card.isSpecial);
    const keywordLabel = fighter?.keyword || card.keyword || "Keyword";
    const cardClasses = [
        "practice-combat-card-face",
        isSelected ? "is-selected" : "",
        card.isSpecial ? "is-special" : "",
        keywordActive ? "is-keyword-active" : "",
        isButton ? "is-button-face" : "",
    ].filter(Boolean).join(" ");

    function renderLanePips(kind, lanes) {
        return COMBAT_LANES.map((lane) => React.createElement(
            "span",
            {
                key: `${card.id}-${kind}-${lane}`,
                className: `practice-combat-card-lane ${kind}${lanes.includes(lane) ? " is-filled" : ""}`,
                "aria-hidden": "true",
            },
            formatCombatLane(lane).charAt(0)
        ));
    }

    return React.createElement(
        "div",
        { className: cardClasses },
        React.createElement(
            "div",
            { className: "practice-combat-card-header" },
            React.createElement(
                "div",
                { className: "practice-combat-card-title-block" },
                React.createElement("p", { className: "practice-combat-card-eyebrow" }, card.isSpecial ? "Special Card" : fighter?.displayName || fighter?.name || "Combat Card"),
                React.createElement("strong", { className: "practice-combat-card-name" }, card.name)
            ),
            React.createElement("span", { className: "practice-combat-card-swap-badge" }, `Swap ${formatCombatLane(card.swapLane)}`)
        ),
        React.createElement(
            "div",
            { className: "practice-combat-card-lane-grid" },
            React.createElement(
                "div",
                { className: "practice-combat-card-lane-block" },
                React.createElement("p", { className: "practice-combat-card-lane-label" }, "Attack"),
                React.createElement("div", { className: "practice-combat-card-lane-row" }, renderLanePips("attack", attackLanes))
            ),
            React.createElement(
                "div",
                { className: "practice-combat-card-lane-block" },
                React.createElement("p", { className: "practice-combat-card-lane-label" }, "Defense"),
                React.createElement("div", { className: "practice-combat-card-lane-row" }, renderLanePips("defense", defenseLanes))
            )
        ),
        React.createElement(
            "div",
            { className: "practice-combat-card-footer" },
            React.createElement("span", { className: "practice-combat-card-keyword" }, keywordActive ? `${keywordLabel} active` : keywordLabel),
            React.createElement("span", { className: "practice-combat-card-copy" }, keywordActive ? "Technique live this clash." : "Printed lanes only.")
        )
    );
}

function CombatModal({
    combatState,
    onChooseCard,
    onChooseMode,
    onAdvancePhase,
    onClose,
    onTriggerStumble,
}) {
    const leftFighter = combatState.combatants[combatState.attackerId] || null;
    const rightFighter = combatState.combatants[combatState.defenderId] || null;
    const phase = COMBAT_PHASES[combatState.phaseIndex] || COMBAT_PHASES[0];

    if (!leftFighter || !rightFighter) {
        return null;
    }

    const leftCard = leftFighter.selectedCardId ? getCombatCardById(leftFighter, leftFighter.selectedCardId) : null;
    const rightCard = rightFighter.selectedCardId ? getCombatCardById(rightFighter, rightFighter.selectedCardId) : null;
    const leftEffective = leftCard && leftFighter.selectedMode ? getEffectiveCardForCombatant(leftFighter) : null;
    const rightEffective = rightCard && rightFighter.selectedMode ? getEffectiveCardForCombatant(rightFighter) : null;
    const canAdvanceSelection = Boolean(
        leftFighter.selectedCardId
        && rightFighter.selectedCardId
        && leftFighter.selectedMode
        && rightFighter.selectedMode
    );

    return React.createElement(
        "div",
        { className: "practice-modal-backdrop practice-combat-backdrop", role: "presentation" },
        React.createElement(
            "div",
            {
                className: "practice-modal practice-combat-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-combat-title",
            },
            React.createElement("p", { className: "practice-modal-kicker" }, `Clash ${combatState.clashNumber}`),
            React.createElement("h2", { id: "practice-combat-title" }, `${leftFighter.name} vs ${rightFighter.name}`),
            React.createElement(
                "div",
                { className: "practice-combat-phase-strip", "aria-label": "Combat phases" },
                COMBAT_PHASES.map((phaseItem, index) =>
                    React.createElement(
                        "div",
                        {
                            key: phaseItem.id,
                            className: `practice-combat-phase-chip${index === combatState.phaseIndex ? " is-active" : ""}${index < combatState.phaseIndex ? " is-complete" : ""}`,
                        },
                        React.createElement("span", { className: "practice-combat-phase-count" }, index + 1),
                        React.createElement("span", { className: "practice-combat-phase-name" }, phaseItem.title)
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-combat-grid" },
                React.createElement(CombatantSummary, { fighter: leftFighter, toneClassName: "is-left-combatant" }),
                React.createElement(
                    "section",
                    { className: "practice-combat-phase-panel" },
                    React.createElement("p", { className: "practice-combat-phase-label" }, "Current Clash Step"),
                    React.createElement("h3", null, phase.title),
                    React.createElement("p", { className: "practice-combat-phase-copy" }, phase.copy),
                    combatState.phaseIndex === 0
                        ? React.createElement(
                            "div",
                            { className: "practice-combat-selection-grid" },
                            [leftFighter, rightFighter].map((fighter) => {
                                const selectedCard = fighter.selectedCardId ? getCombatCardById(fighter, fighter.selectedCardId) : null;
                                const selectedConfig = selectedCard ? getEffectiveCardForCombatant(fighter) : null;
                                const availableModes = selectedCard ? getAvailableModes(selectedCard) : [];

                                return React.createElement(
                                    "div",
                                    { key: `selection-${fighter.id}`, className: "practice-combat-selection-column" },
                                    React.createElement("p", { className: "practice-combat-placeholder-label" }, fighter.name),
                                    React.createElement(
                                        "div",
                                        { className: "practice-combat-hand-grid" },
                                        fighter.hand.map((card) =>
                                            React.createElement(
                                                "button",
                                                {
                                                    key: card.id,
                                                    className: `practice-combat-card-button${fighter.selectedCardId === card.id ? " is-selected" : ""}`,
                                                    type: "button",
                                                    onClick: () => onChooseCard(fighter.id, card.id),
                                                },
                                                React.createElement(CombatCardFace, {
                                                    card,
                                                    fighter,
                                                    isSelected: fighter.selectedCardId === card.id,
                                                    isButton: true,
                                                })
                                            )
                                        )
                                    ),
                                    selectedCard
                                        ? React.createElement(
                                            "div",
                                            { className: "practice-combat-mode-grid" },
                                            availableModes.map((mode) =>
                                                React.createElement(
                                                    "button",
                                                    {
                                                        key: `${fighter.id}-${mode.id}`,
                                                        className: `practice-combat-mode-button${fighter.selectedMode === mode.id ? " is-selected" : ""}`,
                                                        type: "button",
                                                        disabled: getModeCost(selectedCard, mode.id) > fighter.currentFormPoints,
                                                        onClick: () => onChooseMode(fighter.id, mode.id),
                                                    },
                                                    React.createElement("strong", null, mode.label),
                                                    React.createElement("span", null, `${mode.copy} Cost ${mode.cost} FP`)
                                                )
                                            )
                                        )
                                        : null,
                                    selectedConfig
                                        ? React.createElement(
                                            "p",
                                            { className: "practice-combat-phase-copy" },
                                            `Locked in: Atk ${describeLaneSet(selectedConfig.attackLanes)} / Def ${describeLaneSet(selectedConfig.defenseLanes)}${selectedConfig.keywordActive ? ` / ${selectedConfig.keyword}` : ""}`
                                        )
                                        : null
                                );
                            })
                        )
                        : null,
                    combatState.phaseIndex === 1 && leftEffective && rightEffective
                        ? React.createElement(
                            "div",
                            { className: "practice-combat-reveal-grid" },
                            [[leftFighter, leftEffective], [rightFighter, rightEffective]].map(([fighter, config]) =>
                                React.createElement(
                                    "article",
                                    { key: `reveal-${config.card.id}`, className: "practice-combat-placeholder-card" },
                                    React.createElement("p", { className: "practice-combat-placeholder-label" }, fighter.name),
                                    React.createElement(CombatCardFace, {
                                        card: config.card,
                                        fighter,
                                        effectiveConfig: config,
                                    }),
                                    React.createElement("p", null, config.keywordActive ? `Keyword Active: ${config.keyword}` : "Keyword inactive this clash")
                                )
                            )
                        )
                        : null,
                    combatState.phaseIndex === 2 && leftEffective && rightEffective
                        ? React.createElement(
                            "div",
                            { className: "practice-combat-reveal-grid" },
                            [leftFighter, rightFighter].map((fighter) => {
                                const config = fighter.id === leftFighter.id ? leftEffective : rightEffective;
                                const canStumble = config.allowsReactionStumble && !fighter.stumbleTriggered;

                                return React.createElement(
                                    "div",
                                    { key: `reaction-${fighter.id}`, className: "practice-combat-placeholder-card" },
                                    React.createElement("p", { className: "practice-combat-placeholder-label" }, fighter.name),
                                    React.createElement("p", null, canStumble ? "Stumble may swap this revealed card for a random different card." : "No optional reaction remains for this fighter in this clash."),
                                    canStumble
                                        ? React.createElement(
                                            "button",
                                            {
                                                className: "practice-combat-button is-primary",
                                                type: "button",
                                                onClick: () => onTriggerStumble(fighter.id),
                                            },
                                            "Trigger Stumble"
                                        )
                                        : null
                                );
                            })
                        )
                        : null,
                    combatState.phaseIndex === 3 && combatState.resolutionSummary
                        ? React.createElement(
                            "div",
                            { className: "practice-combat-placeholder-grid" },
                            React.createElement(
                                "div",
                                { className: "practice-combat-placeholder-card" },
                                React.createElement("p", { className: "practice-combat-placeholder-label" }, leftFighter.name),
                                React.createElement("p", null, combatState.resolutionSummary.leftSummary)
                            ),
                            React.createElement(
                                "div",
                                { className: "practice-combat-placeholder-card" },
                                React.createElement("p", { className: "practice-combat-placeholder-label" }, rightFighter.name),
                                React.createElement("p", null, combatState.resolutionSummary.rightSummary)
                            )
                        )
                        : null,
                    combatState.phaseIndex === 4
                        ? React.createElement(
                            "div",
                            { className: "practice-combat-placeholder-grid" },
                            React.createElement(
                                "div",
                                { className: "practice-combat-placeholder-card" },
                                React.createElement("p", { className: "practice-combat-placeholder-label" }, "Activation"),
                                React.createElement("p", null, "Technique activation is not implemented yet, but the clash loop and deck exhaustion rules are now live.")
                            ),
                            React.createElement(
                                "div",
                                { className: "practice-combat-placeholder-card" },
                                React.createElement("p", { className: "practice-combat-placeholder-label" }, "Clash Log"),
                                React.createElement("p", null, combatState.clashLog[0] || "No clash events recorded yet.")
                            )
                        )
                        : null,
                    React.createElement(
                        "div",
                        { className: "practice-combat-actions" },
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-secondary",
                                type: "button",
                                onClick: onClose,
                            },
                            "Close Combat"
                        ),
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-primary",
                                type: "button",
                                disabled: combatState.phaseIndex === 0 && !canAdvanceSelection,
                                onClick: onAdvancePhase,
                            },
                            combatState.phaseIndex === COMBAT_PHASES.length - 1 ? "Next Clash" : "Next Phase"
                        )
                    )
                ),
                React.createElement(CombatantSummary, { fighter: rightFighter, toneClassName: "is-right-combatant" })
            )
        )
    );
}

function ChallengeModal({ challengeState, players, onChooseTarget, onAccept, onDecline }) {
    const challenger = players.find((player) => player.id === challengeState.challengerId) || null;
    const opponents = challengeState.opponentIds
        .map((playerId) => players.find((player) => player.id === playerId) || null)
        .filter(Boolean);
    const target = challengeState.targetId
        ? players.find((player) => player.id === challengeState.targetId) || null
        : null;

    if (!challenger) {
        return null;
    }

    const challengerDisplayName = getPlayerDisplayName(challenger);
    const targetDisplayName = target ? getPlayerDisplayName(target) : "";

    return React.createElement(
        "div",
        { className: "practice-modal-backdrop practice-combat-backdrop", role: "presentation" },
        React.createElement(
            "div",
            {
                className: "practice-modal practice-challenge-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-challenge-title",
            },
            target
                ? React.createElement(
                    React.Fragment,
                    null,
                    React.createElement("p", { className: "practice-modal-kicker" }, "Combat Challenge"),
                    React.createElement("h2", { id: "practice-challenge-title" }, `${challengerDisplayName} Challenges You!`),
                    React.createElement(
                        "p",
                        { className: "practice-combat-phase-copy" },
                        React.createElement(React.Fragment, null,
                            "You must decide whether to accept the fight.",
                            React.createElement("br"),
                            "Declining will drop your Reputation by 1 rank."
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-combat-actions" },
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-secondary is-decline",
                                type: "button",
                                onClick: onDecline,
                            },
                            "Decline Challenge"
                        ),
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-primary is-accept",
                                type: "button",
                                onClick: onAccept,
                            },
                            "Accept Challenge"
                        )
                    )
                )
                : React.createElement(
                    React.Fragment,
                    null,
                    React.createElement("p", { className: "practice-modal-kicker" }, "Combat Challenge"),
                    React.createElement("h2", { id: "practice-challenge-title" }, `${challengerDisplayName}, choose your target`),
                    React.createElement(
                        "div",
                        { className: "practice-challenge-options" },
                        opponents.map((opponent) =>
                            React.createElement(
                                "button",
                                {
                                    key: opponent.id,
                                    className: "practice-challenge-option",
                                    type: "button",
                                    onClick: () => onChooseTarget(opponent.id),
                                },
                                React.createElement("p", { className: "practice-combatant-kicker" }, "Opponent"),
                                React.createElement("strong", null, getPlayerDisplayName(opponent)),
                                React.createElement("span", null, `${getPlayerCurrentLocationName(opponent)} • Reputation ${opponent.reputation}`)
                            )
                        )
                    )
                )
        )
    );
}

function getRosterEntries(players, startIndex) {
    return players.map((player, offset) => {
        const playerIndex = (startIndex + offset) % players.length;
        return {
            player: players[playerIndex],
            playerIndex,
        };
    });
}

const PLAYER_ACTIONS = [
    { id: "clockwise", label: "Travel", shapeClass: "is-arrow-cw", ariaLabel: "Travel clockwise" },
    { id: "counter-clockwise", label: "Travel", shapeClass: "is-arrow-ccw", ariaLabel: "Travel counter-clockwise" },
    { id: "roll", label: "Quest", shapeClass: "is-quest", ariaLabel: "Quest" },
    { id: "fight", label: "Fight", shapeClass: "is-fight" },
    { id: "heal", label: "Heal", shapeClass: "is-heal" },
    { id: "save-school", label: "Defend", shapeClass: "is-defend", ariaLabel: "Defend" },
];

const TRAVEL_ACTIONS = [PLAYER_ACTIONS[0], PLAYER_ACTIONS[1]];
const OTHER_PLAYER_ACTIONS = PLAYER_ACTIONS.slice(2);

function clonePlayersSnapshot(players) {
    return players.map((player) => ({ ...player }));
}

function cloneSchoolsSnapshot(schools) {
    return schools.map((school) => ({
        ...school,
        defenders: Array.isArray(school.defenders) ? school.defenders.slice() : school.defenders,
    }));
}

function getEventPlayerName(player) {
    return getPlayerDisplayName(player);
}

function getOccupantStyle(locationType, count, index, color) {
    const positions = locationType === "road" ? ROAD_STAR_POSITIONS : TOWN_STAR_POSITIONS;
    const singlePosition = locationType === "road"
        ? { x: "50%", y: "18%" }
        : positions[0];
    const position = count === 1 ? singlePosition : positions[index % positions.length];

    return {
        "--occupant-outline": color,
        left: position.x,
        top: position.y,
    };
}

function getSortedOccupants(players, position) {
    return players
        .filter((player) => player.alive && player.position === position)
        .sort((left, right) => left.arrivalOrder - right.arrivalOrder);
}

function PlayerCard({
    player,
    isActive,
    isWinner,
    actionsRemaining,
    bonusActionsRemaining,
    interactionsLocked,
    pendingRoll,
    canTravel,
    schoolStatus,
    canRollFate,
    canFight,
    canHeal,
    canSaveSchool,
    canUndo,
    saveSchoolProgress,
    saveSchoolIsCompleting,
    actionIndicatorsRef,
    onRollFate,
    onFight,
    onHeal,
    onPassTurn,
    onUndo,
    onSaveSchool,
    onTravel,
}) {
    const displayName = getPlayerDisplayName(player);
    const sigilSrc = getSchoolSigil(player.name);
    const statusFaceSrc = getFighterStatusFace(player.alive ? (player.injured ? "injured" : "healthy") : "dead");
    const classes = `practice-roster-card${isActive ? " is-active" : ""}${isWinner ? " is-winner" : ""}`;
    const showSiegeFire = schoolStatus === SCHOOL_STATUS_SIEGED;

    return React.createElement(
        "article",
        {
            className: classes,
            style: { "--accent": player.color, opacity: player.alive ? 1 : 0.62 },
        },
        React.createElement(
            "div",
            { className: "practice-roster-top" },
            React.createElement(
                "div",
                { className: "practice-roster-title" },
                React.createElement("span", {
                    className: "practice-roster-dot",
                    style: { backgroundColor: player.color },
                }),
                React.createElement(
                    "div",
                    { className: "practice-roster-title-stack" },
                    React.createElement("p", { className: "practice-roster-player-name" }, displayName),
                    React.createElement("p", {
                        className: `practice-roster-city-name${player.alive ? "" : " is-dead"}`,
                        style: { "--roster-city-color": player.color },
                    }, player.name)
                )
            ),
            React.createElement(
                "div",
                { className: "practice-roster-corner" },
                React.createElement("img", {
                    className: "practice-roster-status-face",
                    src: statusFaceSrc,
                    alt: player.alive ? (player.injured ? `${displayName} is injured` : `${displayName} is healthy`) : `${displayName} is dead`,
                }),
                sigilSrc
                    ? React.createElement(
                        "span",
                        { className: "practice-sigil-wrap" },
                        React.createElement("img", {
                            className: "practice-roster-sigil",
                            src: sigilSrc,
                            alt: `${displayName} school sigil`,
                        }),
                        React.createElement("img", {
                            className: `practice-siege-fire${showSiegeFire ? " is-visible" : ""}`,
                            src: FIRE_ICON,
                            alt: "",
                            "aria-hidden": "true",
                        })
                    )
                    : null
            )
        ),
        !player.alive
            ? React.createElement("p", { className: "practice-roster-location" }, "Dead")
            : null,
        React.createElement(
            "div",
            { className: "practice-roster-stats" },
            React.createElement(StatPill, { label: "Power", value: player.power }),
            React.createElement(StatPill, { label: "Stamina", value: player.stamina }),
            React.createElement(StatPill, { label: "Agility", value: player.agility }),
            React.createElement(StatPill, { label: "Chi", value: player.chi }),
            React.createElement(StatPill, { label: "Wit", value: player.wit })
        ),
        React.createElement(
            "div",
            { className: "practice-roster-bar-wrap" },
            React.createElement("p", { className: "practice-roster-bar-label" }, "Reputation"),
            React.createElement(
                "div",
                {
                    className: "practice-roster-bar-indicator",
                    style: { "--reputation-position": player.reputation },
                    "aria-label": `Reputation ${player.reputation} of 5`,
                },
                React.createElement(
                    "div",
                    { className: "practice-roster-bar", "aria-hidden": "true" },
                    React.createElement("span", { className: "practice-roster-bar-segment is-black" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-black" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-brown" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-brown" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-gold" })
                ),
                React.createElement("span", { className: "practice-roster-bar-pointer" })
            )
        ),
        isActive
            ? React.createElement(
                "div",
                { className: "practice-active-turn-row" },
                React.createElement(
                    "button",
                    {
                        className: "practice-turn-arrow-button is-undo",
                        type: "button",
                        disabled: !canUndo || interactionsLocked,
                        onClick: onUndo,
                        "aria-label": "Undo",
                    },
                    React.createElement("span", { className: "practice-turn-arrow practice-turn-arrow-undo" }, "Undo")
                ),
                React.createElement(
                    "div",
                    { className: "practice-action-indicators" },
                    React.createElement("p", { className: "practice-action-indicators-label" }, "Actions"),
                    React.createElement(
                        "div",
                        {
                            className: "practice-action-indicators-row",
                            ref: actionIndicatorsRef,
                        },
                        Array.from({ length: actionsRemaining }).map((_, index) =>
                            React.createElement("span", {
                                key: `action-${player.id}-${index}`,
                                className: `practice-action-indicator${index < bonusActionsRemaining ? " is-bonus" : ""}`,
                                "aria-label": `Action ${index + 1} remaining`,
                            })
                        )
                    )
                ),
                React.createElement(
                    "button",
                    {
                        className: "practice-turn-arrow-button is-pass",
                        type: "button",
                        disabled: interactionsLocked,
                        onClick: onPassTurn,
                        "aria-label": "Pass turn",
                    },
                    React.createElement("span", { className: "practice-turn-arrow practice-turn-arrow-pass" }, "Pass Turn")
                )
            )
            : null,
        isActive
            ? React.createElement(
                "div",
                { className: "practice-player-actions" },
                React.createElement(
                    "div",
                    { className: "practice-player-action-group is-travel-group" },
                    React.createElement(
                        "div",
                        { className: "practice-travel-buttons" },
                        TRAVEL_ACTIONS.map((action) =>
                            React.createElement(
                                "button",
                                {
                                    key: `${player.id}-${action.id}`,
                                    className: `practice-player-action-button ${action.id === "counter-clockwise" ? "is-left-travel" : ""}`,
                                    type: "button",
                                    "aria-label": action.ariaLabel || action.label,
                                    disabled: interactionsLocked || !canTravel,
                                    onClick: () => onTravel(action.id === "clockwise" ? CW_DIR_VALUE : CCW_DIR_VALUE),
                                },
                                React.createElement("span", {
                                    className: `practice-player-action-shape ${action.shapeClass} is-image-arrow`,
                                    "aria-hidden": "true",
                                    style: { "--travel-icon": `url("${TRAVEL_ARROWS_ICON}")`, backgroundImage: `url("${TRAVEL_ARROWS_ICON}")` },
                                })
                            )
                        )
                    ),
                    React.createElement("span", { className: "practice-player-action-text" }, "Travel")
                ),
                OTHER_PLAYER_ACTIONS.map((action) => {
                    const isRollFateAction = action.id === "roll";
                    const isFightAction = action.id === "fight";
                    const isHealAction = action.id === "heal";
                    const isSaveSchoolAction = action.id === "save-school";
                    const isDisabled = isRollFateAction
                        ? !canRollFate || interactionsLocked
                        : isFightAction
                        ? !canFight || interactionsLocked
                        : isHealAction
                        ? !canHeal || interactionsLocked
                        : isSaveSchoolAction
                            ? !canSaveSchool || interactionsLocked
                            : true || interactionsLocked;
                    const buttonClassName = `practice-player-action-button${isSaveSchoolAction ? " is-save-school" : ""}${saveSchoolIsCompleting && isSaveSchoolAction ? " is-completing" : ""}`;

                    return React.createElement(
                        "button",
                        {
                            key: `${player.id}-${action.id}`,
                            className: buttonClassName,
                            type: "button",
                            "aria-label": action.ariaLabel || action.label,
                            disabled: isDisabled,
                            onClick: isRollFateAction
                                ? onRollFate
                                : isFightAction
                                ? onFight
                                : isHealAction
                                ? onHeal
                                : isSaveSchoolAction
                                    ? onSaveSchool
                                    : undefined,
                        },
                        React.createElement(
                            "span",
                            { className: "practice-player-action-main" },
                            React.createElement("span", {
                                className: `practice-player-action-shape ${action.shapeClass}${isSaveSchoolAction ? " is-image-defend" : ""}${isRollFateAction ? " is-image-quest" : ""}${isHealAction ? " is-image-heal" : ""}`,
                                "aria-hidden": "true",
                                style: isSaveSchoolAction
                                    ? {
                                        "--defend-icon": `url("${DEFEND_ICON}")`,
                                        "--defend-fire-icon": `url("${FIRE_ICON}")`,
                                    }
                                    : isHealAction
                                        ? { "--heal-icon": `url("${HEAL_ICON}")`, backgroundImage: `url("${HEAL_ICON}")` }
                                        : isRollFateAction
                                            ? { "--quest-icon": `url("${QUEST_ICON}")`, backgroundImage: `url("${QUEST_ICON}")` }
                                            : undefined,
                            }),
                            React.createElement("span", { className: "practice-player-action-text" }, action.label)
                        ),
                        isSaveSchoolAction
                            ? React.createElement(
                                "span",
                                {
                                    className: "practice-save-school-pips",
                                    "aria-hidden": "true",
                                },
                                Array.from({ length: 3 }).map((_, index) =>
                                    React.createElement("span", {
                                        key: `save-pip-${index}`,
                                        className: `practice-save-school-pip${index < saveSchoolProgress ? " is-filled" : ""}`,
                                    })
                                )
                            )
                            : null
                    );
                })
            )
            : null
    );
}

function BoardNode({ index, location, players, school }) {
    const sigilSrc = location.type === "town" ? getSchoolSigil(location.name) : "";
    const occupants = getSortedOccupants(players, index);
    const showSiegeFire = school?.status === SCHOOL_STATUS_SIEGED;
    const isDestroyed = school?.status === SCHOOL_STATUS_DESTROYED;

    return React.createElement(
        "div",
        {
            className: `practice-node practice-node-${location.type}`,
            style: getTrackStyle(index, location.hue),
        },
        React.createElement(
            "div",
            { className: "practice-node-core" },
            location.type === "town" && sigilSrc
                ? React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                        "span",
                        { className: `practice-sigil-wrap${isDestroyed ? " is-destroyed" : ""}` },
                        React.createElement("img", {
                            className: `practice-node-sigil${isDestroyed ? " is-destroyed" : ""}`,
                            src: sigilSrc,
                            alt: `${location.name} sigil`,
                        }),
                        React.createElement("img", {
                            className: `practice-siege-fire${showSiegeFire ? " is-visible" : ""}`,
                            src: FIRE_ICON,
                            alt: "",
                            "aria-hidden": "true",
                        })
                    ),
                    React.createElement("span", { className: "practice-node-label" }, location.name)
                )
                : null
        ),
        occupants.length > 0
            ? React.createElement(
                "div",
                { className: "practice-node-occupants" },
                occupants.map((player) =>
                    React.createElement("span", {
                        key: `${location.id}-${player.id}`,
                        className: `practice-occupant${player.injured ? " is-injured" : ""}`,
                        title: getPlayerDisplayName(player),
                        style: getOccupantStyle(location.type, occupants.length, occupants.indexOf(player), player.color),
                    })
                )
            )
            : null
    );
}

function SchoolCard({ school }) {
    const accent = school.status === SCHOOL_STATUS_DESTROYED
        ? "#8f3c3c"
        : school.status === SCHOOL_STATUS_SIEGED
            ? "#c88d2a"
            : "#d7b372";
    const statusLabel = school.status === SCHOOL_STATUS_DESTROYED
        ? "Destroyed"
        : school.status === SCHOOL_STATUS_SIEGED
            ? school.isCompletingSave
                ? "Sieged • Rescue complete"
                : `Sieged • ${school.saveProgress}/3 saved`
            : "Whole";

    return React.createElement(
        "article",
        {
            className: "practice-effect-card",
            style: { "--accent": accent },
        },
        React.createElement("h3", null, school.name),
        React.createElement("p", null, statusLabel)
    );
}

function copyRect(rect) {
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    };
}

function isSingleTurnRotation(previousOrder, nextOrder) {
    return (
        previousOrder.length > 1
        && previousOrder.length === nextOrder.length
        && previousOrder[0] === nextOrder[nextOrder.length - 1]
        && previousOrder.slice(1).every((playerId, index) => playerId === nextOrder[index])
    );
}

function animateWrappedRosterItem(node, previousRect, previousSnapshot) {
    const ghostNode = previousSnapshot ? previousSnapshot.cloneNode(true) : node.cloneNode(true);
    const ghostActionIndicators = ghostNode.querySelector(".practice-action-indicators");

    if (ghostActionIndicators) {
        ghostActionIndicators.style.opacity = "0";
    }

    ghostNode.style.position = "fixed";
    ghostNode.style.top = `${previousRect.top}px`;
    ghostNode.style.left = `${previousRect.left}px`;
    ghostNode.style.width = `${previousRect.width}px`;
    ghostNode.style.height = `${previousRect.height}px`;
    ghostNode.style.margin = "0";
    ghostNode.style.pointerEvents = "none";
    ghostNode.style.zIndex = "9999";

    document.body.appendChild(ghostNode);

    const fadeOut = ghostNode.animate(
        [
            { opacity: 1, transform: "scale(1)" },
            { opacity: 0, transform: "scale(0.96)" },
        ],
        {
            duration: 280,
            easing: "ease",
            fill: "forwards",
        }
    );

    node.animate(
        [
            { opacity: 0, transform: "scale(0.96)" },
            { opacity: 1, transform: "scale(1)" },
        ],
        {
            duration: 320,
            delay: 180,
            easing: "ease",
            fill: "both",
        }
    );

    fadeOut.finished.finally(() => {
        ghostNode.remove();
    });
}

function createActionIndicatorGhost() {
    const ghost = document.createElement("span");
    ghost.className = "practice-action-indicator is-ghost";
    ghost.setAttribute("aria-hidden", "true");
    return ghost;
}

function PracticeGame() {
    const [players, setPlayers] = React.useState(createInitialPlayers);
    const [schools, setSchools] = React.useState(createSchools);
    const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState(0);
    const [actionsRemaining, setActionsRemaining] = React.useState(() => getActionsForPlayer(createInitialPlayers()[0]));
    const [currentTurnBonusActionsRemaining, setCurrentTurnBonusActionsRemaining] = React.useState(0);
    const [nextArrivalOrder, setNextArrivalOrder] = React.useState(createPlayers().length);
    const [pendingRoll, setPendingRoll] = React.useState(null);
    const [battleLog, setBattleLog] = React.useState([]);
    const [winnerId, setWinnerId] = React.useState(null);
    const [gameOverReason, setGameOverReason] = React.useState("");
    const [isResolvingAction, setIsResolvingAction] = React.useState(false);
    const [challengeState, setChallengeState] = React.useState(null);
    const [combatState, setCombatState] = React.useState(null);
    const [selectedProfilePlayerId, setSelectedProfilePlayerId] = React.useState(null);
    const [showHometownModal, setShowHometownModal] = React.useState(false);
    const [isClosingHometownModal, setIsClosingHometownModal] = React.useState(false);
    const [showRulesModal, setShowRulesModal] = React.useState(false);
    const [undoState, setUndoState] = React.useState(null);

    const currentPlayer = players[currentPlayerIndex];
    const selectedProfilePlayer = players.find((player) => player.id === selectedProfilePlayerId) || null;
    const winner = players.find((player) => player.id === winnerId) || null;
    const currentLocation = currentPlayer ? TRACK_DETAILS[currentPlayer.position] : TRACK_DETAILS[0];
    const currentTownCopy = getTownCopy(currentLocation.id);
    const livingPlayers = getAlivePlayers(players);
    const rosterEntries = getRosterEntries(players, currentPlayerIndex);
    const currentSchool = currentLocation && isTown(currentLocation.id)
        ? getSchoolById(schools, currentLocation.id)
        : null;
    const currentPlayerCanRollFate = Boolean(
        currentPlayer?.alive
        && pendingRoll === null
    );
    const currentPlayerCanTravel = Boolean(currentPlayer?.alive);
    const currentPlayerRivals = currentPlayer ? getRivalsAtPosition(players, currentPlayerIndex) : [];
    const currentPlayerCanFight = Boolean(
        currentPlayer?.alive
        && currentPlayerRivals.length > 0
        && !combatState
        && !challengeState
    );
    const currentPlayerCanHeal = Boolean(currentPlayer?.injured && currentLocation && isTown(currentLocation.id));
    const currentPlayerCanSaveSchool = Boolean(
        currentPlayer?.alive
        && currentSchool
        && currentSchool.status === SCHOOL_STATUS_SIEGED
        && !currentSchool.isCompletingSave
    );
    const rosterRefs = React.useRef(new Map());
    const previousRosterRects = React.useRef(new Map());
    const previousRosterOrder = React.useRef([]);
    const previousRosterSnapshots = React.useRef(new Map());
    const saveCompletionTimeouts = React.useRef(new Map());
    const actionIndicatorsRefs = React.useRef(new Map());
    const actionAnimationTimeoutRef = React.useRef(null);
    const hometownModalTimeoutRef = React.useRef(null);
    const rosterOrderKey = rosterEntries.map(({ player }) => player.id).join(",");
    const currentSaveSchoolProgress = currentSchool?.saveProgress || 0;
    const currentSaveSchoolIsCompleting = Boolean(currentSchool?.isCompletingSave);
    const currentPlayerCanUndo = Boolean(
        currentPlayer
        && undoState
        && undoState.playerId === currentPlayer.id
    );

    React.useEffect(() => {
        if (winnerId || gameOverReason || players.length === 0 || livingPlayers.length === 0) {
            return;
        }

        if (currentPlayer?.alive) {
            return;
        }

        const nextPlayerIndex = getNextLivingIndex(players, Number.isInteger(currentPlayerIndex) ? currentPlayerIndex : -1);
        const nextPlayer = players[nextPlayerIndex];

        if (!nextPlayer?.alive) {
            return;
        }

        const preparedTurn = consumeNextTurnActionBonus(players, nextPlayerIndex);

        setPlayers(preparedTurn.players);
        setCurrentPlayerIndex(nextPlayerIndex);
        setActionsRemaining(preparedTurn.actions);
        setCurrentTurnBonusActionsRemaining(preparedTurn.consumedBonusActions);
        setPendingRoll(null);
        setUndoState(null);
        setIsResolvingAction(false);
    }, [currentPlayer, currentPlayerIndex, gameOverReason, livingPlayers.length, players, winnerId]);

    React.useEffect(() => {
        if (players.length === 0) {
            return;
        }

        if (showHometownModal && selectedProfilePlayerId === null) {
            return;
        }

        if (players.some((player) => player.id === selectedProfilePlayerId)) {
            return;
        }

        setSelectedProfilePlayerId(players[0].id);
    }, [players, selectedProfilePlayerId, showHometownModal]);

    function chooseHometown(playerId) {
        setSelectedProfilePlayerId(playerId);
        setIsClosingHometownModal(true);
        window.clearTimeout(hometownModalTimeoutRef.current);
        hometownModalTimeoutRef.current = window.setTimeout(() => {
            setShowHometownModal(false);
            setIsClosingHometownModal(false);
            hometownModalTimeoutRef.current = null;
        }, 1000);
    }

    React.useEffect(() => () => {
        if (hometownModalTimeoutRef.current !== null) {
            window.clearTimeout(hometownModalTimeoutRef.current);
        }
    }, []);

    React.useEffect(() => {
        if (!showRulesModal) {
            return undefined;
        }

        function handleKeydown(event) {
            if (event.key === "Escape") {
                setShowRulesModal(false);
            }
        }

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [showRulesModal]);

    React.useLayoutEffect(() => {
        const nextRects = new Map();
        const nextOrder = rosterEntries.map(({ player }) => player.id);
        const wrappedPlayerId = isSingleTurnRotation(previousRosterOrder.current, nextOrder)
            ? previousRosterOrder.current[0]
            : null;

        rosterEntries.forEach(({ player }) => {
            const node = rosterRefs.current.get(player.id);

            if (node) {
                nextRects.set(player.id, copyRect(node.getBoundingClientRect()));
            }
        });

        nextRects.forEach((nextRect, playerId) => {
            const previousRect = previousRosterRects.current.get(playerId);

            if (!previousRect) {
                return;
            }

            const node = rosterRefs.current.get(playerId);

            if (!node) {
                return;
            }

            if (wrappedPlayerId === playerId) {
                animateWrappedRosterItem(node, previousRect, previousRosterSnapshots.current.get(playerId));
                return;
            }

            if (previousRect.top === nextRect.top) {
                return;
            }

            node.animate(
                [
                    { transform: `translateY(${previousRect.top - nextRect.top}px)` },
                    { transform: "translateY(0)" },
                ],
                {
                    duration: 1000,
                    easing: "ease",
                }
            );
        });

        const nextSnapshots = new Map();

        rosterEntries.forEach(({ player }) => {
            const node = rosterRefs.current.get(player.id);

            if (node) {
                nextSnapshots.set(player.id, node.cloneNode(true));
            }
        });

        previousRosterRects.current = nextRects;
        previousRosterOrder.current = nextOrder;
        previousRosterSnapshots.current = nextSnapshots;
    }, [rosterOrderKey]);

    React.useLayoutEffect(() => {
        actionIndicatorsRefs.current.forEach((rowNode) => {
            if (!rowNode) {
                return;
            }

            rowNode.querySelectorAll(".practice-action-indicator").forEach((indicatorNode) => {
                indicatorNode.getAnimations().forEach((animation) => {
                    animation.cancel();
                });
            });
        });
    }, [actionsRemaining, currentPlayerIndex, winnerId, gameOverReason]);

    function appendLog(message) {
        setBattleLog((existing) => [message].concat(existing));
    }

    React.useEffect(() => () => {
        if (actionAnimationTimeoutRef.current) {
            window.clearTimeout(actionAnimationTimeoutRef.current);
        }
        saveCompletionTimeouts.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        saveCompletionTimeouts.current.clear();
    }, []);

    function clearSaveCompletionTimeouts() {
        saveCompletionTimeouts.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        saveCompletionTimeouts.current.clear();
    }

    function clearActionAnimationTimeout() {
        if (actionAnimationTimeoutRef.current) {
            window.clearTimeout(actionAnimationTimeoutRef.current);
            actionAnimationTimeoutRef.current = null;
        }
    }

    function queueSchoolSaveCompletion(schoolId) {
        const existingTimeout = saveCompletionTimeouts.current.get(schoolId);

        if (existingTimeout) {
            window.clearTimeout(existingTimeout);
        }

        const timeoutId = window.setTimeout(() => {
            setSchools((existingSchools) => existingSchools.map((school) => (
                school.id === schoolId
                    ? {
                        ...school,
                        saveProgress: 0,
                        isCompletingSave: false,
                    }
                    : school
            )));
            saveCompletionTimeouts.current.delete(schoolId);
        }, 500);

        saveCompletionTimeouts.current.set(schoolId, timeoutId);
    }

    function syncSchoolSaveCompletionTimeouts(restoredSchools) {
        clearSaveCompletionTimeouts();
        restoredSchools.forEach((school) => {
            if (school.isCompletingSave) {
                queueSchoolSaveCompletion(school.id);
            }
        });
    }

    function consumeActionWithIndicators(onAfterAnimation, refundedActions = 0) {
        const actionCount = actionsRemaining;
        const rowNode = currentPlayer ? actionIndicatorsRefs.current.get(currentPlayer.id) : null;
        const finish = () => {
            clearActionAnimationTimeout();
            onAfterAnimation();
            setIsResolvingAction(false);
        };

        setIsResolvingAction(true);

        if (!rowNode) {
            finish();
            return;
        }

        const indicators = Array.from(rowNode.querySelectorAll(".practice-action-indicator"));
        const indicatorGap = parseFloat(window.getComputedStyle(rowNode).gap || "8");

        if (actionCount === 1 && refundedActions > 0 && indicators.length >= 1) {
            const overlay = document.createElement("span");
            const rightGhost = createActionIndicatorGhost();
            const leftGhost = createActionIndicatorGhost();
            const indicatorWidth = indicators[0].getBoundingClientRect().width;
            const centerDelta = (indicatorWidth + indicatorGap) / 2;

            overlay.className = "practice-action-indicator-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.append(leftGhost, rightGhost);
            rowNode.appendChild(overlay);
            rowNode.style.opacity = "0";

            rightGhost.animate(
                [
                    { transform: "translate(-50%, -50%)", opacity: 1 },
                    { transform: `translate(calc(-50% + ${centerDelta}px), -50%)`, opacity: 1, offset: 0.2 },
                    { transform: `translate(calc(-50% + ${centerDelta}px), -50%)`, opacity: 1, offset: 0.36 },
                    { transform: `translate(calc(-50% + ${centerDelta}px), -50%) scale(0)`, opacity: 0 },
                ],
                {
                    duration: 620,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            leftGhost.animate(
                [
                    { transform: `translate(calc(-50% - ${centerDelta}px), -50%) scale(0)`, opacity: 0 },
                    { transform: `translate(calc(-50% - ${centerDelta}px), -50%) scale(1)`, opacity: 1, offset: 0.2 },
                    { transform: `translate(calc(-50% - ${centerDelta}px), -50%) scale(1)`, opacity: 1, offset: 0.36 },
                    { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
                ],
                {
                    duration: 620,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            actionAnimationTimeoutRef.current = window.setTimeout(() => {
                rowNode.style.opacity = "";
                overlay.remove();
                finish();
            }, 620);
            return;
        }

        if (actionCount > 1 && indicators.length >= 2) {
            const [leftIndicator, rightIndicator] = indicators;
            const leftBounds = leftIndicator.getBoundingClientRect();
            const rightBounds = rightIndicator.getBoundingClientRect();
            const centerDelta = (rightBounds.left - leftBounds.left) / 2;

            leftIndicator.animate(
                [
                    { transform: "translateX(0)", opacity: 1 },
                    { transform: `translateX(${centerDelta}px)`, opacity: 1 },
                ],
                {
                    duration: 500,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            rightIndicator.animate(
                [
                    { transform: "scale(1)", opacity: 1 },
                    { transform: "scale(0)", opacity: 0 },
                ],
                {
                    duration: 500,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            actionAnimationTimeoutRef.current = window.setTimeout(finish, 500);
            return;
        }

        if (actionCount === 1 && indicators.length >= 1) {
            indicators[0].animate(
                [
                    { transform: "scale(1)", opacity: 1 },
                    { transform: "scale(0)", opacity: 0 },
                ],
                {
                    duration: 250,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            actionAnimationTimeoutRef.current = window.setTimeout(finish, 250);
            return;
        }

        finish();
    }

    function resolveTurnEnd(updatedPlayers, updatedSchools) {
        setUndoState(null);
        setCurrentTurnBonusActionsRemaining(0);
        setPlayers(updatedPlayers);
        setSchools(updatedSchools);

        const aliveAfterTurn = getAlivePlayers(updatedPlayers);

        if (aliveAfterTurn.length === 0) {
            setActionsRemaining(0);
            setGameOverReason("Every challenger is dead. The Silver Wolf remains undefeated.");
            return;
        }

        const turnLogs = [];
        const schoolsBeforeTurn = updatedSchools.map((school) => ({ ...school }));
        const schoolsStillStanding = advanceSilverWolf(updatedSchools, turnLogs);
        const destroyedSchoolCountBefore = schoolsBeforeTurn.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
        const destroyedSchoolCountAfter = updatedSchools.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
        const newlyDestroyedSchoolIds = updatedSchools
            .filter((school) => (
                school.status === SCHOOL_STATUS_DESTROYED
                && getSchoolById(schoolsBeforeTurn, school.id)?.status !== SCHOOL_STATUS_DESTROYED
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

        setSchools(updatedSchools);
        turnLogs.forEach((entry) => appendLog(entry));

        if (!schoolsStillStanding) {
            setActionsRemaining(0);
            setGameOverReason("The Silver Wolf destroyed all five schools. The valley was not protected.");
            return;
        }

        const nextPlayerIndex = getNextLivingIndex(updatedPlayers, currentPlayerIndex);
        const preparedTurn = consumeNextTurnActionBonus(updatedPlayers, nextPlayerIndex);

        setPlayers(preparedTurn.players);
        setCurrentPlayerIndex(nextPlayerIndex);
        setActionsRemaining(preparedTurn.actions);
        setCurrentTurnBonusActionsRemaining(preparedTurn.consumedBonusActions);
        setPendingRoll(null);
    }

    function finalizeAction(updatedPlayers, updatedSchools, logEntries, refundedActions = 0) {
        consumeActionWithIndicators(() => {
            const nextActionsRemaining = Math.max(0, actionsRemaining - 1 + refundedActions);
            const nextBonusActionsRemaining = Math.max(0, currentTurnBonusActionsRemaining - 1);

            setPlayers(updatedPlayers);
            setSchools(updatedSchools);
            logEntries.forEach((entry) => appendLog(entry));
            setPendingRoll(null);

            if (nextActionsRemaining > 0) {
                setActionsRemaining(nextActionsRemaining);
                setCurrentTurnBonusActionsRemaining(nextBonusActionsRemaining);
                return;
            }
            resolveTurnEnd(updatedPlayers, updatedSchools);
        }, refundedActions);
    }

    function passTurn() {
        if (!currentPlayer?.alive || isResolvingAction || combatState || challengeState) {
            return;
        }

        setIsResolvingAction(true);
        setUndoState(null);
        setPlayers((existingPlayers) => {
            const aliveAfterTurn = getAlivePlayers(existingPlayers);

            if (aliveAfterTurn.length === 0) {
                setActionsRemaining(0);
                setGameOverReason("Every challenger is dead. The Silver Wolf remains undefeated.");
                setPendingRoll(null);
                setIsResolvingAction(false);
                return existingPlayers;
            }

            const turnLogs = [];
            const updatedSchools = schools.map((school) => ({ ...school }));
            const schoolsBeforeTurn = updatedSchools.map((school) => ({ ...school }));
            const schoolsStillStanding = advanceSilverWolf(updatedSchools, turnLogs);
            const destroyedSchoolCountBefore = schoolsBeforeTurn.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
            const destroyedSchoolCountAfter = updatedSchools.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
            const newlyDestroyedSchoolIds = updatedSchools
                .filter((school) => (
                    school.status === SCHOOL_STATUS_DESTROYED
                    && getSchoolById(schoolsBeforeTurn, school.id)?.status !== SCHOOL_STATUS_DESTROYED
                ))
                .map((school) => school.id);
            const updatedPlayers = existingPlayers.map((player) => ({ ...player }));

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

            setSchools(updatedSchools);
            turnLogs.forEach((entry) => appendLog(entry));
            setPendingRoll(null);

            if (!schoolsStillStanding) {
                setActionsRemaining(0);
                setGameOverReason("The Silver Wolf destroyed all five schools. The valley was not protected.");
                setIsResolvingAction(false);
                return updatedPlayers;
            }

            const nextPlayerIndex = getNextLivingIndex(updatedPlayers, currentPlayerIndex);
            const preparedTurn = consumeNextTurnActionBonus(updatedPlayers, nextPlayerIndex);

            setCurrentPlayerIndex(nextPlayerIndex);
            setActionsRemaining(preparedTurn.actions);
            setCurrentTurnBonusActionsRemaining(preparedTurn.consumedBonusActions);
            setIsResolvingAction(false);
            return preparedTurn.players;
        });
    }

    function resetGame() {
        clearActionAnimationTimeout();
        clearSaveCompletionTimeouts();
        setIsResolvingAction(false);
        setPlayers(createInitialPlayers());
        setSchools(createSchools());
        setCurrentPlayerIndex(0);
        setActionsRemaining(getActionsForPlayer(createInitialPlayers()[0]));
        setCurrentTurnBonusActionsRemaining(0);
        setNextArrivalOrder(createPlayers().length);
        setPendingRoll(null);
        setWinnerId(null);
        setGameOverReason("");
        setBattleLog([]);
        setChallengeState(null);
        setCombatState(null);
        setSelectedProfilePlayerId(null);
        setShowHometownModal(false);
        setIsClosingHometownModal(false);
        setUndoState(null);
    }

    function openCombatModal() {
        if (
            winnerId
            || gameOverReason
            || !currentPlayer?.alive
            || actionsRemaining < 1
            || isResolvingAction
            || combatState
            || challengeState
            || currentPlayerRivals.length === 0
        ) {
            return;
        }

        setUndoState(null);
        setChallengeState({
            challengerId: currentPlayer.id,
            opponentIds: currentPlayerRivals.map((player) => player.id),
            targetId: currentPlayerRivals.length === 1 ? currentPlayerRivals[0].id : null,
        });
    }

    function advanceCombatPhase() {
        setCombatState((existing) => {
            if (!existing) {
                return existing;
            }

            const leftCombatant = existing.combatants[existing.attackerId];
            const rightCombatant = existing.combatants[existing.defenderId];

            if (existing.phaseIndex === 0) {
                if (!leftCombatant?.selectedCardId || !rightCombatant?.selectedCardId || !leftCombatant.selectedMode || !rightCombatant.selectedMode) {
                    return existing;
                }

                const leftSelectedCard = getCombatCardById(leftCombatant, leftCombatant.selectedCardId);
                const rightSelectedCard = getCombatCardById(rightCombatant, rightCombatant.selectedCardId);
                const leftCost = leftSelectedCard ? getModeCost(leftSelectedCard, leftCombatant.selectedMode) : 0;
                const rightCost = rightSelectedCard ? getModeCost(rightSelectedCard, rightCombatant.selectedMode) : 0;

                return {
                    ...existing,
                    phaseIndex: 1,
                    combatants: {
                        ...existing.combatants,
                        [existing.attackerId]: {
                            ...leftCombatant,
                            currentFormPoints: Math.max(0, leftCombatant.currentFormPoints - leftCost),
                        },
                        [existing.defenderId]: {
                            ...rightCombatant,
                            currentFormPoints: Math.max(0, rightCombatant.currentFormPoints - rightCost),
                        },
                    },
                };
            }

            if (existing.phaseIndex === 1) {
                return {
                    ...existing,
                    phaseIndex: 2,
                };
            }

            if (existing.phaseIndex === 2) {
                const leftConfig = getEffectiveCardForCombatant(leftCombatant);
                const rightConfig = getEffectiveCardForCombatant(rightCombatant);

                if (!leftConfig || !rightConfig) {
                    return existing;
                }

                const leftOutcome = resolveAttackAgainstDefender(leftConfig, rightConfig);
                const rightOutcome = resolveAttackAgainstDefender(rightConfig, leftConfig);
                const leftReversalHits = leftConfig.grantsReversal ? leftOutcome.blocks : 0;
                const rightReversalHits = rightConfig.grantsReversal ? rightOutcome.blocks : 0;
                const nextLeftHitPoints = Math.max(0, leftCombatant.currentHitPoints - rightOutcome.hits - rightReversalHits);
                const nextRightHitPoints = Math.max(0, rightCombatant.currentHitPoints - leftOutcome.hits - leftReversalHits);
                const resolutionSummary = {
                    leftSummary: `${leftCombatant.name} deals ${leftOutcome.hits + leftReversalHits} total damage and blocks ${rightOutcome.blocks} attack(s).`,
                    rightSummary: `${rightCombatant.name} deals ${rightOutcome.hits + rightReversalHits} total damage and blocks ${leftOutcome.blocks} attack(s).`,
                };
                const nextLog = [
                    `${leftCombatant.name} deals ${leftOutcome.hits} strike damage${leftReversalHits ? ` and ${leftReversalHits} Reversal damage` : ""}. ${rightCombatant.name} deals ${rightOutcome.hits} strike damage${rightReversalHits ? ` and ${rightReversalHits} Reversal damage` : ""}.`,
                ].concat(existing.clashLog);

                return {
                    ...existing,
                    phaseIndex: 3,
                    clashLog: nextLog,
                    resolutionSummary,
                    combatants: {
                        ...existing.combatants,
                        [existing.attackerId]: {
                            ...leftCombatant,
                            currentHitPoints: nextLeftHitPoints,
                        },
                        [existing.defenderId]: {
                            ...rightCombatant,
                            currentHitPoints: nextRightHitPoints,
                        },
                    },
                };
            }

            if (existing.phaseIndex === 3) {
                const leftStillStanding = existing.combatants[existing.attackerId].currentHitPoints > 0;
                const rightStillStanding = existing.combatants[existing.defenderId].currentHitPoints > 0;

                if (!leftStillStanding || !rightStillStanding) {
                    return existing;
                }

                return {
                    ...existing,
                    phaseIndex: 4,
                };
            }

            if (existing.phaseIndex >= COMBAT_PHASES.length - 1) {
                return {
                    ...existing,
                    clashNumber: existing.clashNumber + 1,
                    phaseIndex: 0,
                    resolutionSummary: null,
                    combatants: {
                        ...existing.combatants,
                        [existing.attackerId]: settleCombatCardUse(existing.combatants[existing.attackerId]),
                        [existing.defenderId]: settleCombatCardUse(existing.combatants[existing.defenderId]),
                    },
                };
            }

            return {
                ...existing,
                phaseIndex: existing.phaseIndex + 1,
            };
        });
    }

    function closeCombatModal() {
        setCombatState(null);
    }

    function chooseCombatCard(fighterId, cardId) {
        setCombatState((existing) => {
            if (!existing) {
                return existing;
            }

            const combatant = existing.combatants[fighterId];

            if (!combatant) {
                return existing;
            }

            return {
                ...existing,
                combatants: {
                    ...existing.combatants,
                    [fighterId]: {
                        ...combatant,
                        selectedCardId: cardId,
                        effectiveCardId: cardId,
                        selectedMode: null,
                        stumbleTriggered: false,
                    },
                },
            };
        });
    }

    function chooseCombatMode(fighterId, modeId) {
        setCombatState((existing) => {
            if (!existing) {
                return existing;
            }

            const combatant = existing.combatants[fighterId];
            const selectedCard = combatant ? getCombatCardById(combatant, combatant.selectedCardId) : null;

            if (!combatant || !selectedCard) {
                return existing;
            }

            if (getModeCost(selectedCard, modeId) > combatant.currentFormPoints) {
                return existing;
            }

            return {
                ...existing,
                combatants: {
                    ...existing.combatants,
                    [fighterId]: {
                        ...combatant,
                        selectedMode: modeId,
                        effectiveCardId: combatant.selectedCardId,
                        stumbleTriggered: false,
                    },
                },
            };
        });
    }

    function triggerCombatStumble(fighterId) {
        setCombatState((existing) => {
            if (!existing) {
                return existing;
            }

            const combatant = existing.combatants[fighterId];
            const selectedCard = combatant ? getCombatCardById(combatant, combatant.selectedCardId) : null;

            if (!combatant || !selectedCard) {
                return existing;
            }

            const availableCards = combatant.hand.filter((card) => card.id !== combatant.selectedCardId);

            if (availableCards.length === 0) {
                return existing;
            }

            const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];

            return {
                ...existing,
                clashLog: [`${combatant.name} triggers Stumble and swaps into ${randomCard.name}.`].concat(existing.clashLog),
                combatants: {
                    ...existing.combatants,
                    [fighterId]: {
                        ...combatant,
                        effectiveCardId: randomCard.id,
                        stumbleTriggered: true,
                    },
                },
            };
        });
    }

    React.useEffect(() => {
        if (!combatState) {
            return;
        }

        const leftCombatant = combatState.combatants[combatState.attackerId];
        const rightCombatant = combatState.combatants[combatState.defenderId];

        if (!leftCombatant || !rightCombatant) {
            return;
        }

        const bothDown = leftCombatant.currentHitPoints <= 0 && rightCombatant.currentHitPoints <= 0;
        const loserId = bothDown
            ? combatState.defenderId
            : leftCombatant.currentHitPoints <= 0
                ? combatState.attackerId
                : rightCombatant.currentHitPoints <= 0
                    ? combatState.defenderId
                    : null;

        if (!loserId) {
            return;
        }

        const winnerCombatant = loserId === combatState.attackerId ? rightCombatant : leftCombatant;
        const loserCombatant = loserId === combatState.attackerId ? leftCombatant : rightCombatant;

        setPlayers((existingPlayers) => existingPlayers.map((player) => {
            if (player.id === loserId) {
                return {
                    ...player,
                    injured: true,
                    reputation: clampStat(player.reputation - 1),
                };
            }

            if (player.id === winnerCombatant.id) {
                return {
                    ...player,
                    reputation: clampStat(player.reputation + 1),
                    bonusActionsNextTurn: (player.bonusActionsNextTurn || 0) + 1,
                };
            }

            return player;
        }));
        appendLog(`${getEventPlayerName(winnerCombatant)} defeats ${getEventPlayerName(loserCombatant)} in combat. ${getEventPlayerName(winnerCombatant)} gains 1 Reputation and a temporary extra action next turn. ${getEventPlayerName(loserCombatant)} becomes Injured and loses 1 Reputation.`);
        setCombatState(null);
    }, [combatState]);

    function chooseChallengeTarget(targetId) {
        setChallengeState((existing) => (
            existing
                ? {
                    ...existing,
                    targetId,
                }
                : existing
        ));
    }

    function acceptChallenge() {
        if (!challengeState?.targetId) {
            return;
        }

        consumeActionWithIndicators(() => {
            const shouldBankAction = actionsRemaining > 1;
            const updatedPlayers = shouldBankAction
                ? grantSingleUseActionForNextTurn(players, challengeState.challengerId)
                : players;

            setPendingRoll(null);
            setChallengeState(null);
            setCombatState(startCombatEncounter(updatedPlayers, challengeState.challengerId, challengeState.targetId));

            if (shouldBankAction) {
                resolveTurnEnd(updatedPlayers, cloneSchoolsSnapshot(schools));
                return;
            }

            setPlayers(updatedPlayers);
            setActionsRemaining((existing) => Math.max(0, existing - 1));
            setCurrentTurnBonusActionsRemaining((existing) => Math.max(0, existing - 1));
        });
    }

    function declineChallenge() {
        if (!challengeState?.targetId) {
            return;
        }

        const challenger = players.find((player) => player.id === challengeState.challengerId);
        const target = players.find((player) => player.id === challengeState.targetId);

        consumeActionWithIndicators(() => {
            const updatedPlayers = players.map((player) => ({ ...player }));
            const declinedPlayer = updatedPlayers.find((player) => player.id === challengeState.targetId);
            const shouldBankAction = actionsRemaining > 1;

            if (declinedPlayer) {
                lowerReputation(declinedPlayer, 1);
            }

            const playersAfterBonus = shouldBankAction
                ? grantSingleUseActionForNextTurn(updatedPlayers, challengeState.challengerId)
                : updatedPlayers;

            setPendingRoll(null);
            setChallengeState(null);
            if (challenger && target) {
                appendLog(`${getEventPlayerName(target)} declines ${getEventPlayerName(challenger)}'s challenge and loses 1 Reputation.`);
            }

            if (shouldBankAction) {
                resolveTurnEnd(playersAfterBonus, cloneSchoolsSnapshot(schools));
                return;
            }

            setPlayers(playersAfterBonus);
            setActionsRemaining((existing) => Math.max(0, existing - 1));
            setCurrentTurnBonusActionsRemaining((existing) => Math.max(0, existing - 1));
        });
    }

    function rollFate() {
        if (winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || actionsRemaining < 1 || isResolvingAction) {
            return;
        }

        const result = Math.floor(Math.random() * 4) + 1;
        setUndoState(null);
        consumeActionWithIndicators(() => {
            const shouldBankAction = actionsRemaining > 1;
            const updatedPlayers = shouldBankAction
                ? grantSingleUseActionForNextTurn(players, currentPlayer.id)
                : players;

            if (shouldBankAction) {
                setPendingRoll(result);
                resolveTurnEnd(updatedPlayers, cloneSchoolsSnapshot(schools));
                return;
            }

            setPlayers(updatedPlayers);
            setPendingRoll(result);
            setActionsRemaining((existing) => Math.max(0, existing - 1));
            setCurrentTurnBonusActionsRemaining((existing) => Math.max(0, existing - 1));
        });
    }

    function travel(direction) {
        if (winnerId || gameOverReason || !currentPlayer?.alive || actionsRemaining < 1 || isResolvingAction) {
            return;
        }

        setUndoState({
            playerId: currentPlayer.id,
            players: clonePlayersSnapshot(players),
            schools: cloneSchoolsSnapshot(schools),
            actionsRemaining,
            nextArrivalOrder,
            battleLog: battleLog.slice(),
            pendingRoll,
        });

        const updatedPlayers = clonePlayersSnapshot(players);
        const updatedSchools = cloneSchoolsSnapshot(schools);
        const activePlayer = updatedPlayers[currentPlayerIndex];
        activePlayer.position = normalizeIndex(activePlayer.position + direction);
        activePlayer.arrivalOrder = nextArrivalOrder;
        setNextArrivalOrder(nextArrivalOrder + 1);
        finalizeAction(updatedPlayers, updatedSchools, []);
    }

    function challengeSilverWolf() {
        if (winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || !canChallengeSilverWolf(currentPlayer) || actionsRemaining < 1 || isResolvingAction) {
            return;
        }

        setUndoState(null);
        const updatedPlayers = clonePlayersSnapshot(players);
        const updatedSchools = cloneSchoolsSnapshot(schools);
        const challenger = updatedPlayers[currentPlayerIndex];
        const wolfStrength = getSilverWolfStrength(updatedSchools) + randomDie();
        const challengerStrength = buildCombatScore(challenger);
        const logEntries = [
            `${getEventPlayerName(challenger)} challenges the Silver Wolf with Power ${challenger.power}, Stamina ${challenger.stamina}, Agility ${challenger.agility}, Chi ${challenger.chi}, and Wit ${challenger.wit}.`,
        ];

        if (challengerStrength > wolfStrength) {
            logEntries.push(`${getEventPlayerName(challenger)} defeats the Silver Wolf in combat and wins Valley of the Silver Wolf.`);
            consumeActionWithIndicators(() => {
                setPlayers(updatedPlayers);
                setSchools(updatedSchools);
                setActionsRemaining(0);
                setWinnerId(challenger.id);
                logEntries.forEach((entry) => appendLog(entry));
            });
            return;
        }

        challenger.alive = false;
        logEntries.push(`The Silver Wolf kills ${getEventPlayerName(challenger)}. His kung fu was too strong.`);
        finalizeAction(updatedPlayers, updatedSchools, logEntries);
    }

    function healCurrentPlayer() {
        if (
            winnerId
            || gameOverReason
            || !currentPlayer?.alive
            || actionsRemaining < 1
            || !currentPlayerCanHeal
            || isResolvingAction
        ) {
            return;
        }

        setUndoState({
            playerId: currentPlayer.id,
            players: clonePlayersSnapshot(players),
            schools: cloneSchoolsSnapshot(schools),
            actionsRemaining,
            nextArrivalOrder,
            battleLog: battleLog.slice(),
            pendingRoll,
        });

        const updatedPlayers = clonePlayersSnapshot(players);
        const updatedSchools = cloneSchoolsSnapshot(schools);
        const activePlayer = updatedPlayers[currentPlayerIndex];

        activePlayer.injured = false;
        finalizeAction(updatedPlayers, updatedSchools, [`${getEventPlayerName(activePlayer)} heals at ${currentLocation.name}.`]);
    }

    function saveCurrentSchool() {
        if (
            winnerId
            || gameOverReason
            || !currentPlayer?.alive
            || actionsRemaining < 1
            || !currentPlayerCanSaveSchool
            || isResolvingAction
        ) {
            return;
        }

        setUndoState({
            playerId: currentPlayer.id,
            players: clonePlayersSnapshot(players),
            schools: cloneSchoolsSnapshot(schools),
            actionsRemaining,
            nextArrivalOrder,
            battleLog: battleLog.slice(),
            pendingRoll,
        });

        const updatedPlayers = clonePlayersSnapshot(players);
        const updatedSchools = cloneSchoolsSnapshot(schools);
        const school = getSchoolById(updatedSchools, currentLocation.id);

        if (!school || school.status !== SCHOOL_STATUS_SIEGED) {
            return;
        }

        const nextProgress = Math.min(3, (school.saveProgress || 0) + 1);

        school.saveProgress = nextProgress;
        school.defenders = school.defenders || [];

        if (!school.defenders.includes(currentPlayer.id)) {
            school.defenders = school.defenders.concat(currentPlayer.id);
        }

        if (nextProgress >= 3) {
            school.status = SCHOOL_STATUS_WHOLE;
            school.isCompletingSave = true;
            const defenderNames = updatedPlayers
                .filter((player) => school.defenders.includes(player.id))
                .map((player) => player.name);

            updatedPlayers.forEach((player) => {
                if (school.defenders.includes(player.id)) {
                    raiseReputation(player, 1);
                }
            });
            queueSchoolSaveCompletion(school.id);
            finalizeAction(
                updatedPlayers,
                updatedSchools,
                [`${formatNameList(defenderNames.map((name) => getEventPlayerName(updatedPlayers.find((player) => player.name === name))))} saved ${getSchoolEventLabel(school)}!`]
            );
            return;
        }

        finalizeAction(
            updatedPlayers,
            updatedSchools,
            [`${getEventPlayerName(currentPlayer)} defends ${getSchoolEventLabel(school)}. Progress is now ${nextProgress}/3.`]
        );
    }

    function undoLastAction() {
        if (!currentPlayer?.alive || isResolvingAction || combatState || challengeState || !undoState || undoState.playerId !== currentPlayer.id) {
            return;
        }

        clearActionAnimationTimeout();
        const restoredPlayers = clonePlayersSnapshot(undoState.players);
        const restoredSchools = cloneSchoolsSnapshot(undoState.schools);

        syncSchoolSaveCompletionTimeouts(restoredSchools);
        setPlayers(restoredPlayers);
        setSchools(restoredSchools);
        setActionsRemaining(undoState.actionsRemaining);
        setNextArrivalOrder(undoState.nextArrivalOrder);
        setBattleLog(undoState.battleLog.slice());
        setPendingRoll(undoState.pendingRoll);
        setUndoState(null);
        setIsResolvingAction(false);
    }

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            "main",
            { className: "practice-shell" },
            React.createElement(
                "section",
                { className: "practice-hero" },
                React.createElement("h1", null, "Valley of the Silver Wolf")
            ),
            React.createElement(
                "section",
                { className: "practice-layout" },
                React.createElement(
                    "div",
                    { className: "practice-board-panel" },
                    React.createElement(
                        "div",
                        { className: "practice-board" },
                        React.createElement(
                            "button",
                            {
                                className: "practice-board-info-button",
                                type: "button",
                                onClick: () => setShowRulesModal(true),
                                "aria-label": "Open game rules",
                                title: "Game rules",
                            },
                            "i"
                        ),
                        React.createElement("div", { className: "practice-board-glow" }),
                        TRACK_DETAILS.map((location, index) =>
                            React.createElement(BoardNode, {
                                key: location.id,
                                location,
                                index,
                                players,
                                school: location.type === "town" ? getSchoolById(schools, location.id) : null,
                            })
                        ),
                        React.createElement(
                            "button",
                            {
                                className: `practice-centerpiece${!winnerId && !gameOverReason && currentPlayer?.alive ? " is-active-turn" : ""}`,
                                type: "button",
                                onClick: challengeSilverWolf,
                                disabled: Boolean(winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || !canChallengeSilverWolf(currentPlayer) || isResolvingAction || combatState || challengeState),
                                "aria-label": "Challenge the Silver Wolf",
                                style: { "--centerpiece-image": `url("${MOUNTAIN_ICON}")` },
                            },
                            React.createElement("span", { className: "practice-centerpiece-image", "aria-hidden": "true" }),
                            React.createElement("span", { className: "practice-centerpiece-overlay" }),
                            React.createElement(
                                "span",
                                { className: "practice-centerpiece-text" },
                                React.createElement("span", null, "Challenge the"),
                                React.createElement("span", null, "Silver Wolf")
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-controls" },
                        React.createElement(
                            "div",
                            { className: "practice-turn-card" },
                            selectedProfilePlayer
                                ? React.createElement(FighterProfileCard, { player: selectedProfilePlayer })
                                : null
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-log-card" },
                            React.createElement("h3", null, "Recent events"),
                            battleLog.length > 0
                                ? React.createElement(
                                    "ul",
                                    { className: "practice-log" },
                                    battleLog.map((entry, index) => React.createElement("li", { key: `log-${index}` }, entry))
                                )
                                : React.createElement("p", { className: "practice-log-empty" }, "No major events yet.")
                        )
                    )
                ),
                React.createElement(
                    "aside",
                    { className: "practice-sidebar" },
                    React.createElement("h2", null, "Fighters"),
                    React.createElement(
                        "div",
                        { className: "practice-roster-stack" },
                        rosterEntries.map(({ player, playerIndex }) =>
                            React.createElement(
                                "div",
                                {
                                    key: player.id,
                                    className: `practice-roster-item${selectedProfilePlayerId === player.id ? " is-selected" : ""}`,
                                    onClick: () => setSelectedProfilePlayerId(player.id),
                                    ref: (node) => {
                                        if (node) {
                                            rosterRefs.current.set(player.id, node);
                                        } else {
                                            rosterRefs.current.delete(player.id);
                                        }
                                    },
                                },
                                React.createElement(PlayerCard, {
                                    player,
                                    isActive: currentPlayerIndex === playerIndex && !winnerId && !gameOverReason,
                                    isWinner: winner ? winner.id === player.id : false,
                                    actionsRemaining,
                                    bonusActionsRemaining: currentPlayerIndex === playerIndex ? currentTurnBonusActionsRemaining : 0,
                                    pendingRoll,
                                    canTravel: currentPlayerIndex === playerIndex ? currentPlayerCanTravel : false,
                                    interactionsLocked: currentPlayerIndex === playerIndex ? (isResolvingAction || Boolean(combatState) || Boolean(challengeState)) : false,
                                    schoolStatus: getSchoolByName(schools, player.name)?.status || SCHOOL_STATUS_WHOLE,
                                    canRollFate: currentPlayerIndex === playerIndex ? currentPlayerCanRollFate : false,
                                    canFight: currentPlayerIndex === playerIndex ? currentPlayerCanFight : false,
                                    canHeal: currentPlayerIndex === playerIndex ? currentPlayerCanHeal : false,
                                    canSaveSchool: currentPlayerIndex === playerIndex ? currentPlayerCanSaveSchool : false,
                                    canUndo: currentPlayerIndex === playerIndex ? currentPlayerCanUndo : false,
                                    saveSchoolProgress: currentPlayerIndex === playerIndex ? currentSaveSchoolProgress : 0,
                                    saveSchoolIsCompleting: currentPlayerIndex === playerIndex ? currentSaveSchoolIsCompleting : false,
                                    actionIndicatorsRef: currentPlayerIndex === playerIndex
                                        ? (node) => {
                                            if (node) {
                                                actionIndicatorsRefs.current.set(player.id, node);
                                            } else {
                                                actionIndicatorsRefs.current.delete(player.id);
                                            }
                                        }
                                        : undefined,
                                    onRollFate: rollFate,
                                    onFight: openCombatModal,
                                    onHeal: healCurrentPlayer,
                                    onPassTurn: passTurn,
                                    onUndo: undoLastAction,
                                    onSaveSchool: saveCurrentSchool,
                                    onTravel: travel,
                                })
                            )
                        )
                    )
                )
            )
        ),
        showHometownModal
            ? React.createElement(HometownSelectionModal, {
                players,
                onChoose: chooseHometown,
                isClosing: isClosingHometownModal,
            })
            : null,
        showRulesModal
            ? React.createElement(RulesModal, {
                onClose: () => setShowRulesModal(false),
            })
            : null,
        combatState
            ? React.createElement(CombatModal, {
                combatState,
                onChooseCard: chooseCombatCard,
                onChooseMode: chooseCombatMode,
                onAdvancePhase: advanceCombatPhase,
                onClose: closeCombatModal,
                onTriggerStumble: triggerCombatStumble,
            })
            : null,
        challengeState
            ? React.createElement(ChallengeModal, {
                challengeState,
                players,
                onChooseTarget: chooseChallengeTarget,
                onAccept: acceptChallenge,
                onDecline: declineChallenge,
            })
            : null
    );
}

export function mountGame(rootElement) {
    if (!rootElement || !React || !ReactDOM || !ReactDOM.createRoot) {
        return;
    }

    ReactDOM.createRoot(rootElement).render(React.createElement(PracticeGame));
}
