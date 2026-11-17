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
@media(max-width:640px){.hide{display:none}main{padding-top:24px}td,th{padding:10px}}
</style></head><body><main>
<div class="kicker">Flisk &middot; Traces</div><h1>Only what <span>went wrong.</span></h1><p>Errors, reroutes, slow or unexpected flows and hit caps. A normal request writes nothing. Kept 14 days.</p>
<div class="bar"><a class="btn" id="signin" href="/auth/start">Sign in with GitHub</a><select id="app"><option value="">All apps</option></select><select id="kind"><option value="">All kinds</option><option>error</option><option>rerouted</option><option>slow</option><option>unexpected</option><option>capped</option></select><select id="days"><option value="1">Last 1 day</option><option value="7" selected>Last 7 days</option><option value="14">Last 14 days</option></select><button id="go">Refresh</button></div>
<div class="tot" id="tot"></div>
<div class="wrapt" id="wrapt"><div id="msg"></div><table><thead><tr><th>When</th><th>App</th><th>Kind</th><th>What</th><th class="hide">Planned → happened</th><th class="hide">Time</th></tr></thead><tbody id="rows"></tbody></table></div><footer>No prompts, answers or keys are ever stored.</footer>
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
$('go').onclick=load;['app','kind','days'].forEach(i=>$(i).onchange=load);load();
</script></body></html>`;
