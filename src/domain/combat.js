import { clampStat } from "./rules.js";

export const FIGHTER_STYLE_COPY = {
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

export const COMBAT_LANES = ["high", "middle", "low"];
export const COMBAT_MODE_NORMAL = "normal";
export const COMBAT_MODE_KEYWORD = "keyword";
export const COMBAT_MODE_SWAP_ATTACK = "swap-attack";
export const COMBAT_MODE_SWAP_DEFENSE = "swap-defense";

const COMBAT_LANE_LABELS = {
    high: "High",
    middle: "Middle",
    low: "Low",
};

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

export function formatCombatLane(lane) {
    return COMBAT_LANE_LABELS[lane] || lane;
}

export function createCombatDeckForPlayer(player) {
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

export function drawCombatCards(drawPile, amount) {
    return {
        drawnCards: drawPile.slice(0, amount),
        remainingDrawPile: drawPile.slice(amount),
    };
}

export function createCombatantState(player, { shuffle, getPlayerDisplayName }) {
    const shuffledDeck = shuffle(createCombatDeckForPlayer(player));
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
        formSpendFxSeq: 0,
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

export function startCombatEncounter(players, attackerId, defenderId, deps) {
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
        resolutionSummary: null,
        combatants: {
            [attackerId]: createCombatantState(attacker, deps),
            [defenderId]: createCombatantState(defender, deps),
        },
    };
}

export function getCombatCardById(combatant, cardId) {
    return combatant.hand.find((card) => card.id === cardId)
        || combatant.discard.find((card) => card.id === cardId)
        || combatant.drawPile.find((card) => card.id === cardId)
        || null;
}

export function getEffectiveCardForCombatant(combatant) {
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

export function getModeCost(card, mode) {
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

export function getAvailableModes(card) {
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

export function canModifySelectedCard(card, selectedMode) {
    if (!card) {
        return false;
    }

    if (card.isSpecial) {
        return selectedMode === COMBAT_MODE_NORMAL;
    }

    return selectedMode === null;
}

export function areCombatantsReadyToReveal(combatState) {
    if (!combatState) {
        return false;
    }

    const leftCombatant = combatState.combatants[combatState.attackerId];
    const rightCombatant = combatState.combatants[combatState.defenderId];

    return Boolean(
        leftCombatant?.selectedCardId
        && rightCombatant?.selectedCardId
        && leftCombatant?.selectedMode
        && rightCombatant?.selectedMode
        && leftCombatant?.reactionLocked
        && rightCombatant?.reactionLocked
    );
}

export function resolveAttackAgainstDefender(attackerConfig, defenderConfig) {
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

export function settleCombatCardUse(combatant, { shuffle }) {
    const consumedCardId = combatant.effectiveCardId || combatant.selectedCardId;
    const consumedCard = getCombatCardById(combatant, consumedCardId);
    const currentHand = combatant.hand.filter((card) => card.id !== consumedCardId);
    let nextDrawPile = combatant.drawPile.slice();
    let nextDiscard = combatant.discard.concat(consumedCard ? [consumedCard] : []);
    let replenishedHand = currentHand.slice();

    if (replenishedHand.length === 0) {
        if (nextDrawPile.length === 0 && nextDiscard.length > 0) {
            const reshuffledDeck = shuffle(nextDiscard);
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

export function advanceCombatState(combatState, fighterId, { shuffle }) {
    if (!combatState) {
        return combatState;
    }

    const leftCombatant = combatState.combatants[combatState.attackerId];
    const rightCombatant = combatState.combatants[combatState.defenderId];

    if (combatState.phaseIndex === 0) {
        if (!fighterId) {
            return combatState;
        }

        const actingCombatant = combatState.combatants[fighterId];

        if (!actingCombatant?.selectedCardId || !actingCombatant.selectedMode || actingCombatant.reactionLocked) {
            return combatState;
        }

        const combatants = {
            ...combatState.combatants,
            [fighterId]: {
                ...actingCombatant,
                reactionLocked: true,
            },
        };
        const bothReady = areCombatantsReadyToReveal({
            ...combatState,
            combatants,
        });

        return {
            ...combatState,
            phaseIndex: bothReady ? 1 : 0,
            combatants,
        };
    }

    if (combatState.phaseIndex === 1) {
        return {
            ...combatState,
            phaseIndex: 2,
        };
    }

    if (combatState.phaseIndex === 2) {
        const leftConfig = getEffectiveCardForCombatant(leftCombatant);
        const rightConfig = getEffectiveCardForCombatant(rightCombatant);

        if (!leftConfig || !rightConfig) {
            return combatState;
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
        ].concat(combatState.clashLog);

        return {
            ...combatState,
            phaseIndex: 3,
            clashLog: nextLog,
            resolutionSummary,
            combatants: {
                ...combatState.combatants,
                [combatState.attackerId]: {
                    ...leftCombatant,
                    currentHitPoints: nextLeftHitPoints,
                },
                [combatState.defenderId]: {
                    ...rightCombatant,
                    currentHitPoints: nextRightHitPoints,
                },
            },
        };
    }

    if (combatState.phaseIndex === 3) {
        const leftStillStanding = combatState.combatants[combatState.attackerId].currentHitPoints > 0;
        const rightStillStanding = combatState.combatants[combatState.defenderId].currentHitPoints > 0;

        if (!leftStillStanding || !rightStillStanding) {
            return combatState;
        }

        return {
            ...combatState,
            phaseIndex: 4,
        };
    }

    if (combatState.phaseIndex >= 4) {
        return {
            ...combatState,
            clashNumber: combatState.clashNumber + 1,
            phaseIndex: 0,
            resolutionSummary: null,
            combatants: {
                ...combatState.combatants,
                [combatState.attackerId]: settleCombatCardUse(combatState.combatants[combatState.attackerId], { shuffle }),
                [combatState.defenderId]: settleCombatCardUse(combatState.combatants[combatState.defenderId], { shuffle }),
            },
        };
    }

    return {
        ...combatState,
        phaseIndex: combatState.phaseIndex + 1,
    };
}

export function selectCombatCard(combatState, fighterId, cardId) {
    if (!combatState) {
        return combatState;
    }

    const combatant = combatState.combatants[fighterId];
    const selectedCard = combatant ? getCombatCardById(combatant, cardId) : null;

    if (!combatant || !selectedCard || combatant.reactionLocked) {
        return combatState;
    }

    if (combatant.selectedCardId) {
        const previouslySelectedCard = getCombatCardById(combatant, combatant.selectedCardId);
        const refundAmount = previouslySelectedCard ? getModeCost(previouslySelectedCard, combatant.selectedMode) : 0;

        return {
            ...combatState,
            combatants: {
                ...combatState.combatants,
                [fighterId]: {
                    ...combatant,
                    currentFormPoints: Math.min(combatant.maxFormPoints, combatant.currentFormPoints + refundAmount),
                    selectedCardId: null,
                    effectiveCardId: null,
                    selectedMode: null,
                    stumbleTriggered: false,
                },
            },
        };
    }

    const defaultModeId = selectedCard.isSpecial ? COMBAT_MODE_NORMAL : null;

    return {
        ...combatState,
        combatants: {
            ...combatState.combatants,
            [fighterId]: {
                ...combatant,
                selectedCardId: cardId,
                effectiveCardId: cardId,
                selectedMode: defaultModeId,
                stumbleTriggered: false,
            },
        },
    };
}

export function selectCombatMode(combatState, fighterId, modeId) {
    if (!combatState) {
        return combatState;
    }

    const combatant = combatState.combatants[fighterId];
    const selectedCard = combatant ? getCombatCardById(combatant, combatant.selectedCardId) : null;

    if (!combatant || !selectedCard || combatant.reactionLocked) {
        return combatState;
    }

    const previousCost = getModeCost(selectedCard, combatant.selectedMode);
    const nextCost = getModeCost(selectedCard, modeId);
    const costDelta = nextCost - previousCost;

    if (costDelta > combatant.currentFormPoints) {
        return combatState;
    }

    return {
        ...combatState,
        combatants: {
            ...combatState.combatants,
            [fighterId]: {
                ...combatant,
                selectedMode: modeId,
                effectiveCardId: combatant.selectedCardId,
                currentFormPoints: Math.max(0, Math.min(combatant.maxFormPoints, combatant.currentFormPoints - costDelta)),
                formSpendFxSeq: costDelta > 0 ? (combatant.formSpendFxSeq ?? 0) + 1 : (combatant.formSpendFxSeq ?? 0),
                stumbleTriggered: false,
            },
        },
    };
}

export function triggerCombatStumble(combatState, fighterId, { chooseIndex }) {
    if (!combatState) {
        return combatState;
    }

    const combatant = combatState.combatants[fighterId];
    const selectedCard = combatant ? getCombatCardById(combatant, combatant.selectedCardId) : null;

    if (!combatant || !selectedCard) {
        return combatState;
    }

    const availableCards = combatant.hand.filter((card) => card.id !== combatant.selectedCardId);

    if (availableCards.length === 0) {
        return combatState;
    }

    const randomCard = availableCards[chooseIndex(availableCards.length)];

    return {
        ...combatState,
        clashLog: [`${combatant.name} triggers Stumble and swaps into ${randomCard.name}.`].concat(combatState.clashLog),
        combatants: {
            ...combatState.combatants,
            [fighterId]: {
                ...combatant,
                effectiveCardId: randomCard.id,
                stumbleTriggered: true,
            },
        },
    };
}

export function getCombatEncounterResult(combatState) {
    if (!combatState) {
        return null;
    }

    const leftCombatant = combatState.combatants[combatState.attackerId];
    const rightCombatant = combatState.combatants[combatState.defenderId];

    if (!leftCombatant || !rightCombatant) {
        return null;
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
        return null;
    }

    const winnerCombatant = loserId === combatState.attackerId ? rightCombatant : leftCombatant;
    const loserCombatant = loserId === combatState.attackerId ? leftCombatant : rightCombatant;

    return {
        loserId,
        winnerCombatant,
        loserCombatant,
    };
}

export function applyCombatEncounterResult(players, result) {
    if (!result) {
        return players;
    }

    return players.map((player) => {
        if (player.id === result.loserId) {
            return {
                ...player,
                injured: true,
                reputation: clampStat(player.reputation - 1),
            };
        }

        if (player.id === result.winnerCombatant.id) {
            return {
                ...player,
                reputation: clampStat(player.reputation + 1),
                bonusActionsNextTurn: (player.bonusActionsNextTurn || 0) + 1,
            };
        }

        return player;
    });
}
