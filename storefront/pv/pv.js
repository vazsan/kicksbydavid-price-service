/* KBD PDP preview (stub, gate test): marks the page so the gate mechanism can be verified. */
(function () {
  var d = document, h = d.documentElement; if (window.__kbdPvLoaded) return; window.__kbdPvLoaded = 1;
  h.classList.add("kbd-pv");
  function badge() { var b = d.createElement("div"); b.id = "kbd-pv-badge"; b.textContent = "ELŐNÉZET"; d.body.appendChild(b); }
  if (d.body) badge(); else d.addEventListener("DOMContentLoaded", badge);
})();
