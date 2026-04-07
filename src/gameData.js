export const LOCATION_IDS = [
    "#Leap-Creek",
    "#roadLCBS",
    "#Blackstone",
    "#roadBSFM",
    "#Fangmarsh",
    "#roadFMUC",
    "#Underclaw",
    "#roadUCP",
    "#Pouch",
    "#roadPLC",
];

export const CW_DIR_VALUE = 1;
export const CCW_DIR_VALUE = -1;

export const TOWN_DESCRIPTIONS = {
    "#Leap-Creek": {
        Nickname: "The Water Temple",
        "School name": "Temple of T'ai Chi Chuan",
    },
    "#Blackstone": {
        Nickname: "The Iron Fortress",
        "School name": "School of Hong Quan",
    },
    "#Fangmarsh": {
        Nickname: "The Bog That Burns",
        "School name": "Kwoon of Pai Tong Long",
    },
    "#Underclaw": {
        Nickname: "The Buried City",
        "School name": "Kwoon of Changquan",
    },
    "#Pouch": {
        Nickname: "The Wooded Winery",
        "School name": "School of Zui Quan",
    },
};

export const SCHOOL_SIGILS = {
    "Leap-Creek": new URL("../images/leapcreek_sigil.png", import.meta.url).href,
    Blackstone: new URL("../images/blackstone_sigil.png", import.meta.url).href,
    Fangmarsh: new URL("../images/fangmarsh_sigil.png", import.meta.url).href,
    Underclaw: new URL("../images/underclaw_sigil.png", import.meta.url).href,
    Pouch: new URL("../images/pouch_sigil.png", import.meta.url).href,
};

export const FIGHTER_STATUS_FACES = {
    healthy: new URL("../images/grinning-face-with-big-eyes-svgrepo-com.svg", import.meta.url).href,
    injured: new URL("../images/face-with-head-bandage-svgrepo-com.svg", import.meta.url).href,
    dead: new URL("../images/dizzy-face-svgrepo-com.svg", import.meta.url).href,
};

export const TRACK_DETAILS = [
    {
        id: "#Leap-Creek",
        name: "Leap-Creek",
        type: "town",
        hue: "#61c7ff",
        effect: "A school town in the valley.",
    },
    {
        id: "#roadLCBS",
        name: "Stone Ford",
        type: "road",
        hue: "#b89f6d",
        effect: "A road through the valley.",
    },
    {
        id: "#Blackstone",
        name: "Blackstone",
        type: "town",
        hue: "#8e98a6",
        effect: "A school town in the valley.",
    },
    {
        id: "#roadBSFM",
        name: "Ember Road",
        type: "road",
        hue: "#d57a52",
        effect: "A road through the valley.",
    },
    {
        id: "#Fangmarsh",
        name: "Fangmarsh",
        type: "town",
        hue: "#c94c54",
        effect: "A school town in the valley.",
    },
    {
        id: "#roadFMUC",
        name: "Ashen Pass",
        type: "road",
        hue: "#9d815a",
        effect: "A road through the valley.",
    },
    {
        id: "#Underclaw",
        name: "Underclaw",
        type: "town",
        hue: "#49a86d",
        effect: "A school town in the valley.",
    },
    {
        id: "#roadUCP",
        name: "Moonlit Spur",
        type: "road",
        hue: "#769ad9",
        effect: "A road through the valley.",
    },
    {
        id: "#Pouch",
        name: "Pouch",
        type: "town",
        hue: "#a57bed",
        effect: "A school town in the valley.",
    },
    {
        id: "#roadPLC",
        name: "Wolf's Return",
        type: "road",
        hue: "#8d6d54",
        effect: "A road through the valley.",
    },
];

export const STARTING_PLAYERS = [
    { id: "p1", name: "Leap-Creek", color: "#47c3ed", locationIndex: 0 },
    { id: "p2", name: "Blackstone", color: "#7d7f84", locationIndex: 2 },
    { id: "p3", name: "Fangmarsh", color: "#cf4254", locationIndex: 4 },
    { id: "p4", name: "Underclaw", color: "#2f9e61", locationIndex: 6 },
    { id: "p5", name: "Pouch", color: "#8d59df", locationIndex: 8 },
];

export function normalizeIndex(index) {
    return ((index % LOCATION_IDS.length) + LOCATION_IDS.length) % LOCATION_IDS.length;
}

export function getTownCopy(locationId) {
    const townInfo = TOWN_DESCRIPTIONS[locationId];
    return {
        description: townInfo ? townInfo.Nickname : "The Valley of the Star",
        school: townInfo ? townInfo["School name"] : "Wilderness",
    };
}

export function createPlayers() {
    return STARTING_PLAYERS.map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        position: player.locationIndex,
    }));
}

export function getSchoolSigil(playerName) {
    return SCHOOL_SIGILS[playerName] || "";
}

export function getFighterStatusFace(status) {
    return FIGHTER_STATUS_FACES[status] || FIGHTER_STATUS_FACES.healthy;
}
