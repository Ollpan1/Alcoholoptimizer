/**
 * drinks.js — Hantering av dryckesdatabas och sökning för Alkoholkalkyl 🍻
 */

let drinkDatabase = [];

/**
 * Laddar dryckesdatabasen från JSON-fil eller cache.
 * @returns {Promise<Array>}
 */
export async function loadDrinksDatabase() {
    if (drinkDatabase.length > 0) {
        return drinkDatabase;
    }
    try {
        const response = await fetch('./data/systembolaget.json');
        if (!response.ok) {
            throw new Error(`Kunde inte ladda dryckesdatabas: ${response.statusText}`);
        }
        const data = await response.json();
        // Säkerställ att datan är en array
        drinkDatabase = Array.isArray(data) ? data : (data.products || []);
        return drinkDatabase;
    } catch (error) {
        console.error('Fel vid laddning av systembolaget.json:', error);
        return [];
    }
}

/**
 * Beräknar Alkohol Per Krona (APK) för en dryck.
 * APK = (Volym i ml * (Alkoholhalt / 100) * 0.789) / Pris i SEK
 * @param {Object} drink
 * @returns {number} APK (gram ren alkohol per krona)
 */
export function calculateAPK(drink) {
    const volume = drink.volume || drink.Volymiml || 0;
    const abv = drink.abv || drink.Alkoholhalt || 0;
    const price = drink.price || drink.Prisinkl momssek || drink.Pris || 1;

    if (price <= 0) return 0;
    const pureAlcoholGrams = volume * (abv / 100) * 0.789;
    return pureAlcoholGrams / price;
}

/**
 * Söker efter drycker i databasen baserat på söksträcka och filter.
 * @param {string} query - Sökterm
 * @param {Object} options - Filter (kategori, maxPris, minAbv, etc.)
 * @returns {Array} Matchande drycker sorterade efter relevans eller APK
 */
export function searchDrinks(query = '', options = {}) {
    const q = query.toLowerCase().trim();

    let results = drinkDatabase.filter(drink => {
        const name = (drink.name || drink.Namn || '').toLowerCase();
        const category = (drink.category || drink.Varugrupp || '').toLowerCase();
        const type = (drink.type || '').toLowerCase();

        const matchesQuery = !q || name.includes(q) || category.includes(q) || type.includes(q);
        if (!matchesQuery) return false;

        const abv = drink.abv || drink.Alkoholhalt || 0;
        const price = drink.price || drink.Prisinkl momssek || 0;
        const volume = drink.volume || drink.Volymiml || 0;

        if (options.minAbv !== undefined && abv < options.minAbv) return false;
        if (options.maxAbv !== undefined && abv > options.maxAbv) return false;
        if (options.maxPrice !== undefined && price > options.maxPrice) return false;
        if (options.minVolume !== undefined && volume < options.minVolume) return false;

        return true;
    });

    // Sortering
    if (options.sortBy === 'apk') {
        results.sort((a, b) => calculateAPK(b) - calculateAPK(a));
    } else if (options.sortBy === 'priceAsc') {
        results.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (options.sortBy === 'abvDesc') {
        results.sort((a, b) => (b.abv || 0) - (a.abv || 0));
    } else {
        // Standard: Alfabetiskt / relevans
        results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return results.slice(0, options.limit || 50);
}
