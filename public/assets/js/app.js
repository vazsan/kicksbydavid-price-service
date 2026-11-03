// Profit Analytics - shared, non-page-specific JS.
// Intentionally minimal: no framework, no build step. Page-specific
// scripts (e.g. dashboard.js) attach their own behavior.
(function () {
    'use strict';

    // Mobile: the sidebar collapses into a top bar; the Menu button opens it.
    var toggle = document.querySelector('.nav-toggle');
    var sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', function () {
            var open = sidebar.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }
})();
