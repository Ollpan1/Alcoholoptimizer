/**
 * calculations.js - Farmakokinetisk beräkningsmodell för Alkoholkalkyl 🍻
 *
 * Innehåller:
 * - Watson-formeln för exakt beräkning av total kroppsvätska (TBW) baserat på vikt, längd och kön.
 * - Första ordningens absorption från magsäcken.
 * - Michaelis-Menten-kinetik för leverns elimination (förbränning), med stöd för
 *   fysiologiska profiler (t.ex. "Hungrig", "Mätt", "Edward Blom").
 * - Minut-för-minut tidslinjesimulering.
 */

// Fysiologiska profiler för förbränning och absorption
export const PROFILES = {
    hungrig: { name: 'Hungrig', vmaxFactor: 0.8, kmFactor: 0.9, absorptionRate: 0.05 },
    normal: { name: 'Normal / Standard', vmaxFactor: 1.0, kmFactor: 1.0, absorptionRate: 0.03 },
    matt: { name: 'Mätt', vmaxFactor: 1.2, kmFactor: 1.1, absorptionRate: 0.015 },
    edwardBlom: { name: 'Edward Blom (Episk fest)', vmaxFactor: 1.3, kmFactor: 1.2, absorptionRate: 0.02 }
};

/**
 * Beräknar total kroppsvätska (Total Body Water, TBW i liter) med Watson-formeln
 * baserat på kön, vikt, längd och ålder.
 *
 * @param {string} gender - 'man', 'kvinna' eller 'annat'
 * @param {number} weightKg - Kroppsvikt i kg
 * @param {number} heightCm - Längd i cm
 * @param {number} age - Ålder (standard 30 år om ej angivet)
 * @returns {number} Total kroppsvätska i liter
 */
export function calculateTotalBodyWater(gender, weightKg, heightCm, age = 30) {
    let tbw = 0;
    const g = (gender || '').toLowerCase();

    if (g === 'kvinna') {
        // Watson-formel för kvinnor
        tbw = -2.097 + (0.1069 * heightCm) + (0.2466 * weightKg);
    } else {
        // Watson-formel för män (används även som standard för 'annat')
        tbw = 2.447 - (0.09156 * age) + (0.1074 * heightCm) + (0.3362 * weightKg);
    }

    // Säkerställ rimligt minimumvärde beroende på vikt
    if (tbw <= 0 || isNaN(tbw)) {
        tbw = weightKg * (g === 'kvinna' ? 0.60 : 0.70);
    }

    return tbw;
}

/**
 * Beräknar ren alkohol i gram från volym (ml) och alkoholhalt (volymprocent).
 * @param {number} volumeMl - Volym i milliliter
 * @param {number} abvPercent - Alkoholhalt i procent (t.ex. 5.0 för 5%)
 * @returns {number} Gram ren alkohol
 */
export function calculatePureAlcoholGrams(volumeMl, abvPercent) {
    const densityAlcohol = 0.789; // g/ml
    return volumeMl * (abvPercent / 100) * densityAlcohol;
}

/**
 * Simulerar promilleutveckling över tid minut för minut.
 *
 * @param {Object} options
 * @param {number} options.weightKg - Kroppsvikt i kg
 * @param {number} options.heightCm - Längd i cm
 * @param {string} options.gender - 'man', 'kvinna', 'annat'
 * @param {string} options.profileKey - Nyckel för fysiologisk profil ('hungrig', 'normal', 'matt', 'edwardBlom')
 * @param {Array<{time: Date|number, volumeMl: number, abv: number}>} options.drinks - Lista över intagna drycker med tidpunkt och mängd
 * @param {Date|number} options.startTime - Starttid för simuleringen
 * @param {Date|number} options.endTime - Sluttid för simuleringen
 * @returns {Array<{minute: number, timestamp: Date, bac: number, absorbedGrams: grams, stomachGrams: grams}>}
 */
export function simulateTimeline({
    weightKg = 85,
    heightCm = 180,
    gender = 'man',
    profileKey = 'matt',
    drinks = [],
    startTime = new Date(),
    endTime = new Date(new Date(startTime).getTime() + 12 * 60 * 60 * 1000)
}) {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const totalMinutes = Math.max(1, Math.floor((endMs - startMs) / (60 * 1000)));

    // Beräkna kroppsvätska i gram med Watson-formeln (TBW liter * 1000 g/L)
    const tbwLiters = calculateTotalBodyWater(gender, weightKg, heightCm);
    const bodyWaterGrams = tbwLiters * 1000;

    const profile = PROFILES[profileKey] || PROFILES.normal;

    // Basparametrar för Michaelis-Menten elimination
    const baseVmaxPerHour = 0.15 * weightKg * profile.vmaxFactor;
    const VmaxPerMinute = baseVmaxPerHour / 60; // gram per minut
    const Km = 0.20; // promille (g/L) där eliminationen når halv maxhastighet

    // Förbered händelser (drycker sorterade efter tid)
    const normalizedDrinks = drinks.map(d => ({
        timeMs: new Date(d.time).getTime(),
        grams: calculatePureAlcoholGrams(d.volumeMl, d.abv)
    })).sort((a, b) => a.timeMs - b.timeMs);

    let drinkIndex = 0;
    let stomachAlcoholGrams = 0;
    let absorbedAlcoholGrams = 0; // Totalt absorberad som ännu inte brutits ned

    const timeline = [];

    for (let m = 0; m <= totalMinutes; m++) {
        const currentMs = startMs + m * 60 * 1000;

        // Fyll på magen med drycker som konsumerats vid denna minut
        while (drinkIndex < normalizedDrinks.length && normalizedDrinks[drinkIndex].timeMs <= currentMs) {
            stomachAlcoholGrams += normalizedDrinks[drinkIndex].grams;
            drinkIndex++;
        }

        // Första ordningens absorption från mage till blod
        const absorptionRateConstant = profile.absorptionRate; // andel per minut
        const absorbedThisMinute = stomachAlcoholGrams * absorptionRateConstant;
        stomachAlcoholGrams -= absorbedThisMinute;
        absorbedAlcoholGrams += absorbedThisMinute;

        // Beräkna nuvarande promille (BAC) från absorberad alkohol i kroppen
        // 1 promille = 1 g alkohol per 1000 g kroppsvätska
        let currentBac = 0;
        if (bodyWaterGrams > 0) {
            currentBac = (absorbedAlcoholGrams / bodyWaterGrams) * 1000;
        }

        // Michaelis-Menten elimination denna minut
        if (currentBac > 0) {
            const eliminationGramsPerMin = (VmaxPerMinute * currentBac) / (Km + currentBac);
            const eliminatedGrams = Math.min(absorbedAlcoholGrams, eliminationGramsPerMin);
            absorbedAlcoholGrams -= eliminatedGrams;
        }

        currentBac = Math.max(0, currentBac);

        timeline.push({
            minute: m,
            timestamp: new Date(currentMs),
            bac: parseFloat(currentBac.toFixed(4)),
            stomachGrams: parseFloat(stomachAlcoholGrams.toFixed(2)),
            activeGrams: parseFloat(absorbedAlcoholGrams.toFixed(2))
        });
    }

    return timeline;
}
