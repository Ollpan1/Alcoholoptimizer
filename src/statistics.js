/**
 * statistics.js — Sammanställning av konsumtion, promillegrafer och statistik.
 */

/**
 * Beräknar total mängd ren alkohol (gram) och total kostnad från en historiklista.
 * @param {Array} history
 * @returns {Object} { totalGrams, totalCost, totalDrinks }
 */
export function computeConsumptionStats(history = []) {
    let totalGrams = 0;
    let totalCost = 0;
    let totalDrinks = history.length;

    for (const item of history) {
        const volume = item.volumeMl || 0;
        const abv = item.abv || 0;
        const price = item.price || 0;

        const grams = volume * (abv / 100) * 0.789;
        totalGrams += grams;
        totalCost += price;
    }

    return {
        totalGrams: parseFloat(totalGrams.toFixed(1)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalDrinks
    };
}
