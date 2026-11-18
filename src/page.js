// One page: sign in with GitHub (login.flisk.si), see the newest problems by app and kind.
export const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flisk Traces</title>
<style>
:root{--bg:#000;--card:#0a0a0b;--card2:#111113;--ink:#fff;--soft:#d6d3cc;--mute:#9a9690;--faint:#5f5c57;--line:rgba(255,255,255,.1);--line2:rgba(255,255,255,.18);--bad:#ff8a9a;--warn:#ffd27f;--ok:#4ade80;--violet:#b49cff;--holo:linear-gradient(120deg,#7fe3f5,#b49cff 50%,#ff9fd8);--mono:ui-monospace,"SF Mono","Geist Mono",Menlo,monospace;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:300 15px/1.6 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:-120px -20% auto;height:560px;pointer-events:none;background:radial-gradient(ellipse 50% 45% at 30% 30%,rgba(66,92,255,.22),transparent 70%),radial-gradient(ellipse 35% 35% at 78% 20%,rgba(255,159,216,.12),transparent 70%)}
main{position:relative;max-width:1060px;margin:0 auto;padding:40px 20px 64px}
.kicker{font:500 11px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
h1{font:200 clamp(34px,6vw,56px)/1.05 Inter,system-ui,sans-serif;letter-spacing:-.035em;margin:14px 0 12px}
h1 span{background:var(--holo);-webkit-background-clip:text;background-clip:text;color:transparent}
p{color:var(--soft);margin:0 0 28px;max-width:38em}
input,select,button,.btn{font:400 13px var(--mono);color:var(--soft);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:8px 16px;text-decoration:none}
select{appearance:none;padding-right:16px}
button,.btn{background:var(--ink);color:#000;border-color:var(--ink);cursor:pointer;font-weight:500}
.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line2)}
button:hover,.btn:hover{opacity:.88}select:hover{border-color:var(--line2)}
:focus-visible{outline:2px solid var(--violet);outline-offset:3px}
.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:22px}
.tot{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}.tot button{cursor:pointer}.tot button{font:400 12px var(--mono);color:var(--soft);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 12px}.tot button.on{border-color:var(--violet);color:var(--ink)}
.wrapt{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card)}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px 14px;border-top:1px solid var(--line);vertical-align:top}
th{border-top:0;font:500 11px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mute);background:var(--card2)}
tbody tr:hover td{background:rgba(255,255,255,.025)}
td:first-child,.dim{color:var(--mute)}td:first-child{font:400 12px var(--mono);white-space:nowrap}.dim{font-size:13px}
td[class^=k-]{font:500 12px var(--mono)}td[class^=k-]::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;background:currentColor}
.k-error,.k-unexpected{color:var(--bad)}.k-rerouted,.k-slow{color:var(--warn)}.k-capped{color:var(--violet)}
#msg{padding:18px 14px;color:var(--mute)}#msg:empty{display:none}
footer{margin-top:28px;font:400 12px var(--mono);color:var(--faint)}
.tabs{display:flex;gap:6px;margin-bottom:18px}.tabs button{background:var(--card);color:var(--soft);border:1px solid var(--line);font-weight:400}.tabs button.on{background:var(--ink);color:#000;border-color:var(--ink)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}.kpi small{display:block;font:500 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}.kpi b{display:block;font:300 26px/1.3 Inter,system-ui,sans-serif;word-break:break-word}.kpi em{font:400 12px var(--mono);color:var(--mute);font-style:normal}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}.card h2{font:500 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mute);margin:0 0 10px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.lg{display:flex;flex-wrap:wrap;gap:12px;font:400 12px var(--mono);color:var(--soft);margin-bottom:8px}.lg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}
svg text{font:400 11px var(--mono);fill:var(--soft)}svg .m{fill:var(--mute)}svg{width:100%;height:auto;display:block}
@media(max-width:640px){.hide{display:none}main{padding-top:24px}td,th{padding:10px}}
</style><script defer data-domain="traces.flisk.si" src="https://flisk.sh/a.js"></script></head><body><main>
<div class="kicker">Flisk &middot; Traces</div><h1>Only what <span>went wrong.</span></h1><p>Errors, reroutes, slow or unexpected flows and hit caps. A normal request writes nothing. Kept 14 days.</p>
<div class="bar"><a class="btn" id="signin" href="/auth/start">Sign in with GitHub</a><select id="app"><option value="">All apps</option></select><select id="kind"><option value="">All kinds</option><option>error</option><option>rerouted</option><option>slow</option><option>unexpected</option><option>capped</option></select><select id="days"><option value="1">Last 1 day</option><option value="7" selected>Last 7 days</option><option value="14">Last 14 days</option></select><button id="go">Refresh</button></div>
<div class="tabs"><button type="button" id="tabrows" class="on">Rows</button><button type="button" id="tabgraph">Graph</button></div>
<div class="tot" id="tot"></div>
<div id="graph" hidden><div class="kpis" id="kpis"></div><div class="card"><h2>Asks that were rerouted: where they went</h2><div id="tree"></div></div><div class="card"><h2>Reroutes per day</h2><div class="lg" id="daylg"></div><div id="daily"></div></div><div class="grid2"><div class="card"><h2>Why wolf did not answer</h2><div id="reasons"></div></div><div class="card"><h2>Model that answered</h2><div id="models"></div></div></div><div class="card"><h2>Request language</h2><div id="langs"></div></div></div>
<div class="wrapt" id="wrapt"><div id="msg"></div><table><thead><tr><th title="UTC">When (UTC)</th><th>App</th><th>Kind</th><th>What</th><th class="hide">Planned → happened</th><th class="hide">Took</th></tr></thead><tbody id="rows"></tbody></table></div><footer>No prompts, answers or keys are ever stored.</footer>
</main><script>
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(){
  const q=new URLSearchParams({days:$('days').value});if($('app').value)q.set('app',$('app').value);if($('kind').value)q.set('kind',$('kind').value);
  $('msg').textContent='Loading…';
  const r=await fetch('/api/events?'+q,{credentials:'same-origin'});
  if(!r.ok){$('msg').textContent='Sign in with a GitHub account that may read traces.';$('rows').innerHTML='';$('tot').innerHTML='';$('wrapt').querySelector('table').style.display='none';return}
  $('wrapt').querySelector('table').style.display='';
  const d=await r.json();
  $('signin').style.display='none';
  const apps=[...new Set(d.totals.map(t=>t.app))];const cur=$('app').value;
  $('app').innerHTML='<option value="">All apps</option>'+apps.map(a=>'<option'+(a===cur?' selected':'')+'>'+esc(a)+'</option>').join('');
  $('tot').innerHTML=d.totals.map(t=>'<button type="button" class="'+(t.app===$('app').value&&t.kind===$('kind').value?'on':'')+'" data-app="'+esc(t.app)+'" data-kind="'+esc(t.kind)+'" title="Show only this">'+esc(t.app)+' · '+esc(t.kind)+' · '+t.events+'</button>').join('')||'';
  $('msg').textContent=d.events.length?'':'Nothing went wrong in this time. That is the goal.';
  $('rows').innerHTML=d.events.map(e=>'<tr><td class="dim">'+esc(e.created.slice(5,16).replace('T',' '))+'</td><td>'+esc(e.app)+'</td><td class="k-'+esc(e.kind)+'">'+esc(e.kind)+(e.n>1?' ×'+e.n:'')+'</td><td>'+esc(e.why)+'<div class="dim">'+esc(e.route)+(e.detail?' · '+esc(e.detail):'')+'</div></td><td class="hide">'+esc([e.expected,e.actual].filter(Boolean).join(' → '))+'</td><td class="hide">'+(e.ms!=null?Math.round(e.ms/100)/10+' s':'')+'</td></tr>').join('');
}
$('tot').onclick=e=>{const b=e.target.closest('button');if(!b)return;const on=b.classList.contains('on');$('app').value=on?'':b.dataset.app;$('kind').value=on?'':b.dataset.kind;load()};

const COL={'workers-ai':'#6ea8ff','openrouter':'#ff9a5c','pollinations':'#4fd6a2','vercel':'#ffd24d','none':'#ff6b7a'};
const colorOf=k=>COL[k]||'#b49cff';
const NS='http://www.w3.org/2000/svg';
const sv=(w,h,inner)=>'<svg viewBox="0 0 '+w+' '+h+'" role="img">'+inner+'</svg>';
const tx=(x,y,t,cls,anchor)=>'<text x="'+x+'" y="'+y+'"'+(cls?' class="'+cls+'"':'')+(anchor?' text-anchor="'+anchor+'"':'')+'>'+esc(t)+'</text>';
const sortObj=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]);
function hbars(id,o,colorFn,W0){W0=W0||460;
  const rows=sortObj(o).slice(0,10);const mx=Math.max(1,...rows.map(r=>r[1]));let out='';
  rows.forEach((r,i)=>{const y=i*28+4,w=Math.max(2,(r[1]/mx)*(W0-250));out+=tx(0,y+14,r[0].length>24?r[0].slice(0,23)+'…':r[0])+'<rect x="170" y="'+y+'" width="'+w+'" height="18" rx="4" fill="'+colorFn(r[0])+'"/>'+tx(170+w+6,y+14,String(r[1]),'m')});
  $(id).innerHTML=rows.length?sv(W0,rows.length*28+8,out):'<span class="dim">No data</span>';
}
function daily(d){
  const days=Object.keys(d.daily).sort();const dests=sortObj(d.dests).map(e=>e[0]);
  $('daylg').innerHTML=dests.map(k=>'<span><i style="background:'+colorOf(k)+'"></i>'+esc(k)+' '+d.dests[k]+'</span>').join('');
  if(!days.length){$('daily').innerHTML='<span class="dim">No data</span>';return}
  const mx=Math.max(1,...days.map(x=>Object.values(d.daily[x]).reduce((a,b)=>a+b,0)));const W=900,H=220,L=36,B=26,bw=Math.min(36,(W-L)/days.length-8);let out='';
  [0,.5,1].forEach(f=>{const y=H-B-f*(H-B-14);out+='<line x1="'+L+'" x2="'+W+'" y1="'+y+'" y2="'+y+'" stroke="rgba(255,255,255,.08)"/>'+tx(L-6,y+4,String(Math.round(mx*f)),'m','end')});
  days.forEach((day,i)=>{const x=L+i*((W-L)/days.length)+4;let y=H-B;
    dests.forEach(k=>{const v=d.daily[day][k]||0;if(!v)return;const h=v/mx*(H-B-14);y-=h;out+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+Math.max(1,h-1)+'" fill="'+colorOf(k)+'"><title>'+esc(day+' · '+k+' · '+v)+'</title></rect>'});
    out+=tx(x+bw/2,H-8,day.slice(5),'m','middle')});
  $('daily').innerHTML=sv(W,H,out);
}
// Tree from the user's ask to the answer: ask -> request language -> why wolf did not answer -> who answered.
function tree(d){
  if(!d.flow.length){$('tree').innerHTML='<span class="dim">No reroutes in this time. That is the goal.</span>';return}
  const lv=f=>['Rerouted asks',f.lang,f.reason,f.dest],X=[0,235,470,705],NW=12,G=9,H=330;
  const cols=[0,1,2,3].map(c=>{const m={};d.flow.forEach(f=>{const k=lv(f)[c];m[k]=(m[k]||0)+f.n});return sortObj(m).map(e=>({k:e[0],v:e[1]}))});
  const sc=Math.min(...cols.map(c=>(H-G*(c.length-1))/d.total));
  cols.forEach(c=>{let y=0;c.forEach(n=>{n.y=y;n.h=Math.max(3,n.v*sc);y+=n.h+G;n.so=0;n.to=0})});
  const node=(c,k)=>cols[c].find(n=>n.k===k);let links='',nodes='';
  for(let c=0;c<3;c++){const m={};d.flow.forEach(f=>{const l=lv(f),k=l[c]+'\u0001'+l[c+1]+'\u0001'+f.dest;m[k]=(m[k]||0)+f.n});
    Object.entries(m).sort((a,b)=>cols[c].findIndex(n=>n.k===a[0].split('\u0001')[0])-cols[c].findIndex(n=>n.k===b[0].split('\u0001')[0])||cols[c+1].findIndex(n=>n.k===a[0].split('\u0001')[1])-cols[c+1].findIndex(n=>n.k===b[0].split('\u0001')[1])).forEach(([k,v])=>{
      const p=k.split('\u0001'),a=node(c,p[0]),b=node(c+1,p[1]),w=Math.max(1,v*sc);
      const y0=a.y+a.so+w/2,y1=b.y+b.to+w/2;a.so+=w;b.to+=w;const x0=X[c]+NW,x1=X[c+1],xm=(x0+x1)/2;
      links+='<path d="M'+x0+' '+y0+' C'+xm+' '+y0+' '+xm+' '+y1+' '+x1+' '+y1+'" fill="none" stroke="'+colorOf(p[2])+'" stroke-opacity=".4" stroke-width="'+w+'"><title>'+esc(p[0]+' → '+p[1]+' → '+p[2]+' · '+v)+'</title></path>'})}
  cols.forEach((c,ci)=>c.forEach(n=>{nodes+='<rect x="'+X[ci]+'" y="'+n.y+'" width="'+NW+'" height="'+n.h+'" rx="2" fill="'+(ci===3?colorOf(n.k):'#8a8680')+'"/>'+tx(X[ci]+NW+6,n.y+Math.min(n.h,16)/2+4,n.k+' · '+n.v)}));
  const heads=['Ask','Language','Why wolf did not answer','Answered by'];
  $('tree').innerHTML=sv(900,H+30,heads.map((h,i)=>tx(X[i],10,h,'m')).join('')+'<g transform="translate(0,24)">'+links+nodes+'</g>');
}
function graphView(d){
  const top=a=>sortObj(a)[0]||['none',0];const r=top(d.reasons),m=top(d.models);
  const k=(t,b,e)=>'<div class="kpi"><small>'+esc(t)+'</small><b>'+esc(b)+'</b><em>'+esc(e||'')+'</em></div>';
  $('kpis').innerHTML=k('Reroutes',d.total,'last '+d.days+' days')+k('All models failed',d.failed,d.total?Math.round(d.failed/d.total*100)+'% of reroutes':'')+k('Top reason',r[0],r[1]+' times')+k('Top model',m[0],m[1]+' times');
  tree(d);daily(d);hbars('reasons',d.reasons,()=>'#6ea8ff');const md={};d.flow.forEach(f=>{md[f.model]=f.dest});hbars('models',d.models,k2=>colorOf(md[k2]||k2));hbars('langs',d.langs,()=>'#b49cff',900);
}
async function loadGraph(){
  const q=new URLSearchParams({days:$('days').value});if($('app').value)q.set('app',$('app').value);
  const r=await fetch('/api/graph?'+q,{credentials:'same-origin'});
  if(!r.ok){$('kpis').innerHTML='<div class="kpi"><small>Sign in</small><b>Not allowed</b></div>';return}
  graphView(await r.json());
}
let tab='rows';
function setTab(t){tab=t;$('graph').hidden=t!=='graph';$('wrapt').hidden=t==='graph';$('tot').hidden=t==='graph';$('kind').hidden=t==='graph';$('tabrows').className=t==='rows'?'on':'';$('tabgraph').className=t==='graph'?'on':'';if(t==='graph')loadGraph()}
$('tabrows').onclick=()=>setTab('rows');$('tabgraph').onclick=()=>setTab('graph');
const again=()=>tab==='graph'?loadGraph():load();$('go').onclick=again;['app','kind','days'].forEach(i=>$(i).onchange=again);load();
</script></body></html>`;
