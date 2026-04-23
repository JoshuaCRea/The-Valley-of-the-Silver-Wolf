export function createBrowserRandomizer() {
    return {
        chooseIndex(length) {
            return Math.floor(Math.random() * length);
        },
        shuffle(items) {
            const result = items.slice();

            for (let index = result.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
            }

            return result;
        },
        rollDie() {
            return Math.floor(Math.random() * 6) + 1;
        },
        rollQuestDie() {
            return Math.floor(Math.random() * 4) + 1;
        },
    };
}
