/**
 * storage.js — Lokal lagring (localStorage) för användarprofil, historik och sparade drycker.
 */

const STORAGE_KEYS = {
    USER_PROFILE: 'alkoholkalkyl_user_profile',
    DRINK_HISTORY: 'alkoholkalkyl_drink_history',
    FAVOURITES: 'alkoholkalkyl_favourites'
};

const DEFAULT_PROFILE = {
    weightKg: 85,
    heightCm: 180,
    gender: 'man',
    profileKey: 'matt'
};

/**
 * Hämtar sparad användarprofil.
 * @returns {Object}
 */
export function loadUserProfile() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
    } catch (e) {
        console.error('Kunde inte läsa användarprofil från localStorage:', e);
        return DEFAULT_PROFILE;
    }
}

/**
 * Sparar användarprofil.
 * @param {Object} profile
 */
export function saveUserProfile(profile) {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
        console.error('Kunde inte spara användarprofil till localStorage:', e);
    }
}

/**
 * Hämtar historik över intagna drycker.
 * @returns {Array}
 */
export function loadDrinkHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.DRINK_HISTORY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Kunde inte läsa dryckeshistorik:', e);
        return [];
    }
}

/**
 * Sparar historik över intagna drycker.
 * @param {Array} history
 */
export function saveDrinkHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEYS.DRINK_HISTORY, JSON.stringify(history));
    } catch (e) {
        console.error('Kunde inte spara dryckeshistorik:', e);
    }
}
