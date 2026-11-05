// Profit Analytics - dashboard charts.
// Reads window.__dashboardSeries (one row per period bucket, set inline by
// views/dashboard/index.php) and renders it with Chart.js.
// Runs on DOMContentLoaded: this file is included inside the page content,
// before the layout's Chart.js tag at the end of <body>, so Chart is not
// defined yet when it is parsed.
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var series = window.__dashboardSeries || [];
    var currency = window.__dashboardCurrency || 'EUR';
    var labels = series.map(function (row) { return row.label; });

    function chart(canvasId, config) {
        var el = document.getElementById(canvasId);
        if (!el || typeof Chart === 'undefined') {
            return;
        }
        config.options = Object.assign({
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { labels: { boxWidth: 12 } } },
        }, config.options || {});
        new Chart(el.getContext('2d'), config);
    }

    var money = function (v) {
        return Number(v).toLocaleString('hu-HU', { maximumFractionDigits: currency === 'HUF' ? 0 : 2 }) + ' ' + currency;
    };

    chart('chart-revenue-profit', {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Bevétel',
                    data: series.map(function (r) { return r.revenue; }),
                    backgroundColor: 'rgba(47,93,255,0.55)',
                    borderColor: '#2f5dff',
                    borderWidth: 1,
                },
                {
                    label: 'Profit (hirdetés előtt)',
                    data: series.map(function (r) { return r.profit; }),
                    type: 'line',
                    borderColor: '#1a9e6c',
                    backgroundColor: 'rgba(26,158,108,0.15)',
                    tension: 0.25,
                },
            ],
        },
        options: {
            plugins: {
                tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + money(c.parsed.y); } } },
            },
        },
    });

    chart('chart-orders', {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rendelések',
                data: series.map(function (r) { return r.orders; }),
                backgroundColor: 'rgba(201,138,31,0.6)',
                borderColor: '#c98a1f',
                borderWidth: 1,
            }],
        },
        options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
});
