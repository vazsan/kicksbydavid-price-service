// Profit Analytics - live DPD tracking cards on the DPD page.
// Each .trk-card asks /dpd/track/<waybill> (server caches DPD for 3 min)
// and fills in the 5-step bar, the status line and the event timeline.
// Tapping a card opens its timeline. Cards refresh every 3 minutes.
(function () {
    'use strict';

    var cards = Array.prototype.slice.call(document.querySelectorAll('.trk-card'));
    if (!cards.length) {
        return;
    }

    var MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];

    function fmtTime(iso) {
        var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
        if (!m) {
            return '';
        }
        return MONTHS[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + '. ' + m[4] + ':' + m[5];
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) {
            n.className = cls;
        }
        if (text !== undefined) {
            n.textContent = text;
        }
        return n;
    }

    function render(card, data) {
        var segs = card.querySelectorAll('.trk-bar span');
        for (var i = 0; i < segs.length; i++) {
            segs[i].className = i < data.stage ? 'on' : '';
        }
        card.setAttribute('data-tone', data.tone);
        var when = fmtTime(data.updated);
        card.querySelector('.trk-status').textContent = data.label + (when ? ' · ' + when : '');

        var list = card.querySelector('.trk-events');
        list.innerHTML = '';
        data.events.forEach(function (ev) {
            var li = el('li', 'trk-event trk-event-' + ev.tone);
            li.appendChild(el('span', 'trk-event-time', fmtTime(ev.time)));
            li.appendChild(el('span', 'trk-event-label', ev.label));
            if (ev.place) {
                li.appendChild(el('span', 'trk-event-place', ev.place));
            }
            list.appendChild(li);
        });
        if (!data.events.length) {
            list.appendChild(el('li', 'trk-event', 'Még nincs DPD-esemény.'));
        }
    }

    function load(card) {
        var wb = card.getAttribute('data-waybill');
        return fetch('/dpd/track/' + encodeURIComponent(wb), { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then(function (r) {
                return r.json().then(function (body) {
                    if (!r.ok) {
                        throw new Error(body && body.error ? body.error : 'HTTP ' + r.status);
                    }
                    return body;
                });
            })
            .then(function (data) {
                render(card, data);
            })
            .catch(function (err) {
                card.setAttribute('data-tone', 'problem');
                card.querySelector('.trk-status').textContent = 'Nem sikerült lekérni: ' + err.message;
            });
    }

    // At most 4 lookups at a time, so a long list does not flood DPD.
    function loadAll() {
        var queue = cards.slice();
        function next() {
            var card = queue.shift();
            return card ? load(card).then(next) : Promise.resolve();
        }
        var workers = [];
        for (var i = 0; i < 4; i++) {
            workers.push(next());
        }
        Promise.all(workers).then(function () {
            var stamp = document.getElementById('trk-updated');
            if (stamp) {
                var d = new Date();
                stamp.textContent = 'Élő DPD-adat · frissítve ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
            }
        });
    }

    cards.forEach(function (card) {
        var btn = card.querySelector('.trk-summary');
        btn.addEventListener('click', function () {
            var list = card.querySelector('.trk-events');
            var open = list.hasAttribute('hidden');
            if (open) {
                list.removeAttribute('hidden');
            } else {
                list.setAttribute('hidden', '');
            }
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            card.classList.toggle('is-open', open);
        });
    });

    loadAll();
    setInterval(loadAll, 180000);
})();
