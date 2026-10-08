# Builds storefront/kbd-pdp.js from storefront/src/kbd-pdp.src.js:
#   python3 storefront/tools/build-pdp.py storefront/src/kbd-pdp.src.js storefront/kbd-pdp.js v10
import re, sys
src, dst, tag = sys.argv[1], sys.argv[2], sys.argv[3]
s=open(src,encoding='utf-8').read()
s=re.sub(r'(?m)^[ \t]*/\*.*?\*/[ \t]*\n', '', s, flags=re.S)
lines=[l.strip() for l in s.split('\n') if l.strip() and not l.strip().startswith('//')]
s='/* KicksByDavid termékoldal '+tag+' (HU+SK) */\n'+'\n'.join(lines)+'\n'
def compact(css):
    assert '~' not in css and '!M' not in css
    return css.replace('#artdet__main-block ','!M').replace('html.kbd-pdp ','~')
EXP='.split("!M").join("#artdet__main-block ").split("~").join("html.kbd-pdp ")'
# v1 + v2 CSS
for cid in ['kbd-pdp-css','kbd-pdp-css2']:
    m=re.search(r's\.id="'+cid+r'";s\.textContent="((?:\\.|[^"\\])*)";',s)
    assert m, cid
    s=s[:m.start()]+'s.id="'+cid+'";s.textContent=("'+compact(m.group(1))+'")'+EXP+';'+s[m.end():]
# v3 CSS sorok
a=s.index('if(!byId("kbd-pdp-css3")){'); b=s.index('stx.textContent=css;',a)
block=s[a:b]
block=re.sub(r'(?m)^"(html\.kbd-pdp[^\n]*|@media[^\n]*)"(\+?;?)$', lambda mm: '"'+compact(mm.group(1))+'"'+mm.group(2), block)
s=s[:a]+block+'stx.textContent=css'+EXP+';'+s[b+len('stx.textContent=css;'):]
# minden { után szóköz (kivéve: szóköz, számjegy, záró })
s=re.sub(r'\{(?=[^\s\d}])','{ ',s)
open(dst,'w',encoding='utf-8').write(s)
