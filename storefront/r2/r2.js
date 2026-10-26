/* KBD PDP R2, preview only (cookie kbdr2, ?kbdr2=1). HU only. Source: vera/scripts/pdp_ref3_theme.mjs R2_JS + pdp_r2_below.mjs r2BelowJs. */
(function () {
  try {
    var h = location.hostname || "";
    if (/\.sk$/i.test(h) || (document.documentElement.getAttribute("lang") || "").toLowerCase().indexOf("sk") === 0) return;
    var tries = 0, doneA = false, doneB = false;
    var q = function (s) { return document.querySelector(s); };
    function readyA() { return q(".artdet__block-cart-inner") && q("#artdet__type") && q("#artdet__cart") && ((q("#kbd2-pay") && q("#kbd4-checks")) || tries > 60); }
    function readyB() { return q("#kbd2-meta") && ((q("#kbd2-diff") && q(".kbd2-size")) || (tries > 80 && document.documentElement.classList.contains("kbd-ready"))); }   // pages without the data sections (e.g. sold-out size): the meta row and the closed accordion still apply
    function runA() {
      if (doneA) return; doneA = true;
      (()=>{const q=s=>document.querySelector(s);const inner=q('.artdet__block-cart-inner');if(!inner||q('.r2-step'))return;
const wrap=(els,cls,n,order)=>{els=els.filter(Boolean);if(!els.length)return;const d=document.createElement('div');d.className=cls;d.style.order=order;
 if(n){const b=document.createElement('span');b.className='r2-n';b.textContent=n;b.setAttribute('aria-hidden','true');d.append(b);}els[0].before(d);els.forEach(e=>d.append(e));};
wrap([q('#kbd-size-head'),q('#artdet__type')],'r2-step',1,5);
wrap([q('#kbd2-upsell')],'r2-step',2,8);
wrap([q('#artdet__cart'),q('#kbd2-pay'),q('#kbd4-checks')],'r2-buy','',9);
// sold-out size page: no main button inside -> no heavy checkout frame around the 'Nincs raktáron' note (Nora msg 1900)
const bb=q('.r2-buy');if(bb&&!bb.querySelector('.artdet__cart-btn'))bb.classList.add('r2-buy--oos');})();
    }
    function runB() {
      if (doneB) return; doneB = true;
      (()=>{if(document.querySelector('.r2-cmp'))return;const D={"cmp":{"mode":"A","title":"Miért tőlünk?","rows":["Új pár, a saját dobozában","Méret-tanács: írd meg, mit hordasz","Követési link, amint a futár átveszi","1 munkanapon belül válaszolunk","Ingyenes szállítás 46 250 Ft felett"]}};const q=s=>document.querySelector(s);const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
// 1) the 4 function icons join the points/SKU row
const mt=q('#kbd2-meta'),fn=q('#artdet__functions');if(mt&&fn)mt.append(fn);
// 5b) the 'Szállítás és átvétel' accordion starts CLOSED (Unas opens it by default; its answers repeat the FAQ).
// Live: Samu removes .active.show on load; the Unas header button still toggles it.
const sp=q('#pane-custom-section-2');if(sp){sp.classList.remove('active','show');const hb=q('#pane-header-custom-section-2 .pane-header-btn');if(hb){hb.classList.remove('active');hb.setAttribute('aria-expanded','false');}}
// 2) comparison + 8) photo placeholders after the 01/02/03 block
const diff=q('#kbd2-diff');
const cmp=el('section','r2-cmp');const w=el('div','kbd2-w');cmp.append(w);
const C=D.cmp||{"mode":"A","title":"Miért tőlünk?","rows":["Új pár, a saját dobozában","Méret-tanács: írd meg, mit hordasz","Követési link, amint a futár átveszi","1 munkanapon belül válaszolunk","Ingyenes szállítás 46 250 Ft felett"]};if(D.draftLabels)w.append(el('span','r2-draft',C.draft||'Szöveg-vázlat'));w.append(el('h2','r2-h2',C.title));
const lg=q('#header_logo_img img');const logo=lg?'<img alt="KicksByDavid" src="'+lg.src+'">':'KicksByDavid';const card=el('div','r2-card r2-card--'+C.mode);
if(C.mode==='B'){card.append(el('div','r2-row r2-head','<span class="r2-ql">'+C.left+'</span><span class="r2-us">'+logo+'</span>'));
 C.rows.forEach(t=>card.append(el('div','r2-row','<span>'+t+'</span><span class="r2-yes" aria-label="igen, nálunk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>')));}
else{C.rows.forEach(t=>card.append(el('div','r2-li','<span class="r2-yes" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span>'+t.replace('[MEGERŐSÍTENDŐ]','<em class="r2-tbc">megerősítendő</em>')+'</span>')));}
w.append(card);diff.after(cmp);
const ph=el('section','r2-ph');const pw=el('div','kbd2-w');ph.append(pw);
if(D.draftLabels)pw.append(el('span','r2-draft','Opcionális · csak saját fotóval'));pw.append(el('h2','r2-h2','Mielőtt elindul hozzád'));
const g=el('div','r2-ph-g');['Saját fotó: a pár ellenőrzése (címke, cikkszám)','Saját fotó: dobozolás','Saját fotó: csomag átadás'].forEach(t=>g.append(el('div','',t)));pw.append(g);
pw.append(el('p','','Csak akkor kerül ki, ha Dávid lefotózza. AI-kép ide nem mehet.'));cmp.after(ph);
// INACTIVE by default (Dávid TG 2218): shown only when the switch is on: <html class="kbd-photos-on"> or window.KBD_PHOTOS=true
if(!(window.KBD_PHOTOS===true||document.documentElement.classList.contains('kbd-photos-on')))ph.hidden=true;
// 4) size table -> 2-row grid
const tb=q('.kbd2-size table');if(tb){const hs=[...tb.querySelectorAll('thead th')];const ds=[...tb.querySelectorAll('tbody td')];
 const lg=el('div','r2-sz-legend','<span>'+hs[0].textContent+'</span><span>'+tb.querySelector('tbody th').textContent+'</span>');const gz=el('div','r2-sz');
 hs.slice(1).forEach((h,i)=>{const d=ds[i];gz.append(el('div',d&&d.classList.contains('kbd2-cur')?'cur':'','<b>'+h.textContent+'</b><small>'+(d?d.textContent:'')+'</small>'));});
 tb.after(lg);lg.after(gz);}
// 5) reviews (Dávid TG 2215): the live Trustindex widget stays unchanged. Offline it cannot load, so the preview
// shows a real screenshot of the live widget (D.tiShot) in its place; live, nothing is injected here.
const rw=q('.kbd2-rev-widget');if(rw&&D.tiShot){rw.innerHTML='<img class="r2-ti" alt="" src="'+D.tiShot+'"><p class="r2-note">Az élő Trustindex widget változatlanul (képernyőkép, 2026-10-26). Csak a szekció címe és térköze igazodik.</p>';}
// 7) the real Unas rows stay. PREVIEW ONLY: lazy images cannot load offline, so swap in local copies of the same files
if(D.cardImgs){document.querySelectorAll('#artdet__additional-products img.product__img,#artdet__similar-products img.product__img').forEach(im=>{const u=im.getAttribute('data-src')||'';const k=u.split('/').pop();if(D.cardImgs[k]){im.closest('picture')?.querySelectorAll('source').forEach(x=>x.remove());im.src=D.cardImgs[k];im.removeAttribute('data-src');im.classList.remove('lazyload');}});
 // PREVIEW ONLY: the snapshot froze Flickity mid-slide; reset to the first slide (live, Flickity handles it)
 document.querySelectorAll('#artdet__additional-products .flickity-slider,#artdet__similar-products .flickity-slider').forEach(sl=>{sl.style.transform='translateX(0%)';[...sl.querySelectorAll('.carousel-cell')].forEach((c,i)=>{c.style.transform='translateX('+(i*107)+'%)';});});}
})();
    }
    function go() { if (!doneA && readyA()) runA(); if (!doneB && readyB()) runB(); if ((!doneA || !doneB) && tries++ < 200) setTimeout(go, 100); }
    go();
  } catch (e) {}
})();
