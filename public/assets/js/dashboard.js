// Profit Analytics - dashboard charts.
// Reads window.__dashboardSeries (set inline by views/dashboard/index.php)
// and renders it with Chart.js. Kept as one file per page rather than one
// per chart since the data source and axis (stat_date) are shared.
(function () {
    'use strict';

    var series = window.__dashboardSeries || [];
    var labels = series.map(function (row) { return row.stat_date; });

    function lineChart(canvasId, datasets) {
        var el = document.getElementById(canvasId);
        if (!el || typeof Chart === 'undefined') {
            return;
        }
        new Chart(el.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: { y: { beginAtZero: true } },
            },
        });
    }

    lineChart('chart-revenue-profit', [
        {
            label: 'Revenue',
            data: series.map(function (r) { return r.revenue; }),
            borderColor: '#2f5dff',
            backgroundColor: 'rgba(47,93,255,0.1)',
            tension: 0.25,
        },
        {
            label: 'Contribution Profit',
            data: series.map(function (r) { return r.contribution_profit; }),
            borderColor: '#1a9e6c',
            backgroundColor: 'rgba(26,158,108,0.1)',
            tension: 0.25,
        },
    ]);

    lineChart('chart-orders', [
        {
            label: 'Orders',
            data: series.map(function (r) { return r.orders_count; }),
            borderColor: '#c98a1f',
            backgroundColor: 'rgba(201,138,31,0.1)',
            tension: 0.25,
        },
    ]);

    lineChart('chart-ad-spend', [
        {
            label: 'Ad Spend',
            data: series.map(function (r) { return r.ad_spend; }),
            borderColor: '#d64545',
            backgroundColor: 'rgba(214,69,69,0.1)',
            tension: 0.25,
        },
    ]);
})();
