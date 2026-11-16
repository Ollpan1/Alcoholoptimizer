/**
 * app.js — Huvudkontroller för Alkoholkalkyl 🍻
 */

import { loadUserProfile, saveUserProfile, loadDrinkHistory, saveDrinkHistory } from './storage.js';
import { simulateTimeline, PROFILES } from './calculations.js';
import { loadDrinksDatabase, searchDrinks, calculateAPK } from './drinks.js';
import { computeConsumptionStats } from './statistics.js';
import { renderBacChart } from './charts.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Alkoholkalkyl startar...');

    // Sätt standardtid i tidssökaren till nu
    const timeInput = document.getElementById('custom-time');
    if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }

    // Ladda användarprofil
    const profile = loadUserProfile();
    document.getElementById('weight').value = profile.weightKg;
    if (document.getElementById('height')) {
        document.getElementById('height').value = profile.heightCm;
    }
    document.getElementById('gender').value = profile.gender;
    document.getElementById('profile').value = profile.profileKey;

    // Ladda historik
    let history = loadDrinkHistory();

    // Ladda Systembolagets databas i bakgrunden
    const drinks = await loadDrinksDatabase();
    console.log(`Laddade ${drinks.length} drycker från Systembolaget.`);

    // Initiera UI-komponenter & händelselyssnare
    setupEventListeners(history);
    updateApp(history);
});

function setupEventListeners(history) {
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            runSimulation(loadDrinkHistory());
        });
    }

    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Vill du rensa all historik?')) {
                saveDrinkHistory([]);
                updateApp([]);
            }
        });
    }

    const addDrinkSubmit = document.getElementById('add-drink-submit');
    if (addDrinkSubmit) {
        addDrinkSubmit.addEventListener('click', () => {
            const name = document.getElementById('custom-drink-name').value.trim() || 'Egen dryck';
            const volumeMl = parseFloat(document.getElementById('custom-volume').value) || 330;
            const abv = parseFloat(document.getElementById('custom-abv').value) || 5.0;
            const timeStr = document.getElementById('custom-time').value;

            let drinkTime = new Date();
            if (timeStr) {
                const [hours, minutes] = timeStr.split(':').map(Number);
                drinkTime.setHours(hours, minutes, 0, 0);
            }

            const newDrink = {
                name,
                volumeMl,
                abv,
                price: 0,
                time: drinkTime.getTime()
            };

            const currentHistory = loadDrinkHistory();
            currentHistory.push(newDrink);
            saveDrinkHistory(currentHistory);
            updateApp(currentHistory);

            // Återställ fält
            document.getElementById('custom-drink-name').value = '';
            alert(`Lade till ${name} (${volumeMl} ml, ${abv}%)!`);
        });
    }

    const searchInput = document.getElementById('drink-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleDrinkSearch(e.target.value);
        });
    }

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('change', () => {
            const weightKg = parseFloat(document.getElementById('weight').value) || 85;
            const heightCm = parseFloat(document.getElementById('height').value) || 180;
            const gender = document.getElementById('gender').value;
            const profileKey = document.getElementById('profile').value;
            saveUserProfile({ weightKg, heightCm, gender, profileKey });
            runSimulation(loadDrinkHistory());
        });
    }
}

function runSimulation(history) {
    const weightKg = parseFloat(document.getElementById('weight').value) || 85;
    const heightCm = parseFloat(document.getElementById('height').value) || 180;
    const gender = document.getElementById('gender').value;
    const profileKey = document.getElementById('profile').value;

    const timeline = simulateTimeline({
        weightKg,
        heightCm,
        gender,
        profileKey,
        drinks: history,
        startTime: new Date(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000)
    });

    // Uppdatera graf
    const canvas = document.getElementById('bac-chart');
    if (canvas) {
        renderBacChart(canvas, timeline);
    }

    // Uppdatera topp-status (nuvarande promille)
    if (timeline.length > 0) {
        const currentBacElem = document.getElementById('current-bac');
        if (currentBacElem) {
            currentBacElem.textContent = `${timeline[0].bac.toFixed(2)} ‰`;
        }
    }
}

function handleDrinkSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    const results = searchDrinks(query, { limit: 15, sortBy: 'apk' });

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Inga drycker hittades.</div>';
        return;
    }

    resultsContainer.innerHTML = results.map(d => {
        const name = d.name || d.Namn || 'Okänd dryck';
        const abv = d.abv || d.Alkoholhalt || 0;
        const volume = d.volume || d.Volymiml || 0;
        const price = d.price || d.Prisinkl momssek || 0;
        const apk = calculateAPK(d).toFixed(2);

        return `
            <div class="drink-item" data-id="${d.id || d.produktid || ''}">
                <div class="drink-info">
                    <strong>${name}</strong>
                    <span>${volume} ml | ${abv}% | ${price} kr</span>
                </div>
                <div class="drink-apk">
                    <span class="apk-badge">APK: ${apk}</span>
                    <button class="add-drink-btn" data-name="${name}" data-volume="${volume}" data-abv="${abv}" data-price="${price}">+ Lägg till</button>
                </div>
            </div>
        `;
    }).join('');

    // Koppla klick för att lägga till dryck
    resultsContainer.querySelectorAll('.add-drink-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dataset = e.target.dataset;
            const newDrink = {
                name: dataset.name,
                volumeMl: parseFloat(dataset.volume),
                abv: parseFloat(dataset.abv),
                price: parseFloat(dataset.price),
                time: Date.now()
            };
            const history = loadDrinkHistory();
            history.push(newDrink);
            saveDrinkHistory(history);
            updateApp(history);
            alert(`Lade till ${newDrink.name}!`);
        });
    });
}

function updateApp(history) {
    runSimulation(history);
    const stats = computeConsumptionStats(history);
    const statsElem = document.getElementById('stats-summary');
    if (statsElem) {
        statsElem.textContent = `Totalt konsumerat: ${stats.totalGrams}g ren alkohol (${stats.totalDrinks} drycker), Kostnad: ${stats.totalCost} kr`;
    }

    const historyStatus = document.getElementById('history-status');
    if (historyStatus) {
        if (history.length === 0) {
            historyStatus.textContent = 'Inga drinkar registrerade än';
        } else {
            historyStatus.textContent = `${history.length} dryck(er) registrerade i sessionen`;
        }
    }
}
