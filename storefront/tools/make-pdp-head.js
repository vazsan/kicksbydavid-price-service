// Runs kbd-pdp.js in an empty page and extracts its four <style> blocks -> inline head tag for Unas.
const { chromium } = require('playwright'); const fs = require('fs');
const [,, jsFile, cdnUrl, out] = process.argv;
(async () => { const b = await chromium.launch(); const res = {};
  for (const host of ['https://kicksbydavid.hu/x', 'https://www.kicksbydavid.sk/x']) {
    const p = await b.newPage();
    await p.route('**/*', r => r.request().resourceType() === 'document' ? r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head></head><body></body></html>' }) : r.abort());
    await p.goto(host); await p.addScriptTag({ content: fs.readFileSync(jsFile, 'utf8') });
    res[host] = await p.evaluate(() => ['kbd-pdp-css', 'kbd-pdp-css2', 'kbd-pdp-css3', 'kbd-pdp-css0'].map(id => { const e = document.getElementById(id); return e ? e.textContent : null; }));
    await p.close(); }
  await b.close();
  const [hu, sk] = Object.values(res);
  if (JSON.stringify(hu) !== JSON.stringify(sk)) throw new Error('CSS differs between HU and SK');
  if (hu.some(x => !x)) throw new Error('missing style block');
  const ids = ['kbd-pdp-css', 'kbd-pdp-css2', 'kbd-pdp-css3', 'kbd-pdp-css0'];
  const switchJs = '(function(){var on=true;try{var q=location.search;if(/[?&]kbdnew=1/.test(q))localStorage.setItem("kbdnew","1");if(/[?&]kbdnew=0/.test(q))localStorage.removeItem("kbdnew");if(/[?&]kbdoff=1/.test(q))on=false;}catch(e){}if(!on)return;var h=document.documentElement;h.classList.add("kbd-pdp");function rdy(){setTimeout(function(){h.classList.add("kbd-ready");},3000);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",rdy);else rdy();})();';
  const html = '<!-- KicksByDavid termékoldal: CSS a fejlécben (első kirajzolás előtt), a JS aszinkron. Generálva a kbd-pdp.js-ből, kézzel ne szerkeszd. -->\n'
    + '<script>' + switchJs + '</script>\n'
    + ids.map((id, i) => '<style id="' + id + '">' + hu[i].replace(/<\/style/gi, '<\\/style') + '</style>').join('\n') + '\n'
    + '<script async src="' + cdnUrl + '"></script>\n';
  fs.writeFileSync(out, html); console.log('written', out, html.length, 'bytes'); })();
