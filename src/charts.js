/**
 * charts.js — Grafvisualisering för promilletidslinje (använder Chart.js från CDN eller enkel SVG/Canvas).
 */

/**
 * Initialiserar eller uppdaterar promillegrafen.
 * @param {HTMLCanvasElement} canvasElement
 * @param {Array} timelineData
 * @returns {Object|null} Chart-instans
 */
export function renderBacChart(canvasElement, timelineData = []) {
    if (!canvasElement || typeof Chart === 'undefined') {
        console.warn('Chart.js är inte tillgängligt eller canvas saknas.');
        return null;
    }

    const labels = timelineData.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const bacValues = timelineData.map(d => d.bac);

    // Om grafen redan finns på elementet, uppdatera data
    if (canvasElement._chartInstance) {
        canvasElement._chartInstance.data.labels = labels;
        canvasElement._chartInstance.data.datasets[0].data = bacValues;
        canvasElement._chartInstance.update();
        return canvasElement._chartInstance;
    }

    const ctx = canvasElement.getContext('2d');
    const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promille (‰)',
                data: bacValues,
                borderColor: '#e056fd',
                backgroundColor: 'rgba(224, 86, 253, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Promille (‰)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    canvasElement._chartInstance = chartInstance;
    return chartInstance;
}
