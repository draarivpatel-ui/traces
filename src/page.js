// One page: sign in with GitHub (login.flisk.si), see the newest problems by app and kind.
export const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flisk Traces</title>
<style>
:root{--bg:#fbfaf6;--fg:#15171a;--mute:#6b6f76;--line:#dcdad2;--bad:#b3261e}
@media(prefers-color-scheme:dark){:root{--bg:#101214;--fg:#eceae4;--mute:#9a9ea5;--line:#2a2d31;--bad:#ff8a80}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:24px 16px}
h1{font-size:20px;margin:0 0 4px}p{color:var(--mute);margin:0 0 16px}
input,select,button{font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:0;padding:6px 10px}
button{background:var(--fg);color:var(--bg);cursor:pointer}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.tot{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.tot span{border:1px solid var(--line);padding:4px 10px}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:8px 6px;border-top:1px solid var(--line);vertical-align:top}
th{color:var(--mute);font-weight:500}.k-error,.k-unexpected{color:var(--bad)}.dim{color:var(--mute)}
@media(max-width:640px){.hide{display:none}}
</style></head><body><main>
<h1>Flisk Traces</h1><p>Only what went wrong: errors, reroutes, slow or unexpected flows, hit caps. Kept 14 days.</p>
<div class="bar"><a id="signin" href="/auth/start">Sign in with GitHub</a><select id="app"><option value="">All apps</option></select><select id="kind"><option value="">All kinds</option><option>error</option><option>rerouted</option><option>slow</option><option>unexpected</option><option>capped</option></select><select id="days"><option>1</option><option selected>7</option><option>14</option></select><button id="go">Show</button></div>
<div class="tot" id="tot"></div><div id="msg" class="dim"></div>
<table><thead><tr><th>When</th><th>App</th><th>Kind</th><th>What</th><th class="hide">Planned → happened</th><th class="hide">Time</th></tr></thead><tbody id="rows"></tbody></table>
</main><script>
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(){
  const q=new URLSearchParams({days:$('days').value});if($('app').value)q.set('app',$('app').value);if($('kind').value)q.set('kind',$('kind').value);
  $('msg').textContent='Loading…';
  const r=await fetch('/api/events?'+q,{credentials:'same-origin'});
  if(!r.ok){$('msg').textContent='Sign in with a GitHub account that may read traces.';return}
  const d=await r.json();
  const apps=[...new Set(d.totals.map(t=>t.app))];const cur=$('app').value;
  $('app').innerHTML='<option value="">All apps</option>'+apps.map(a=>'<option'+(a===cur?' selected':'')+'>'+esc(a)+'</option>').join('');
  $('tot').innerHTML=d.totals.map(t=>'<span>'+esc(t.app)+' · '+esc(t.kind)+' · '+t.events+'</span>').join('')||'';
  $('msg').textContent=d.events.length?'':'Nothing went wrong in this time. That is the goal.';
  $('rows').innerHTML=d.events.map(e=>'<tr><td class="dim">'+esc(e.created.slice(5,16).replace('T',' '))+'</td><td>'+esc(e.app)+'</td><td class="k-'+esc(e.kind)+'">'+esc(e.kind)+(e.n>1?' ×'+e.n:'')+'</td><td>'+esc(e.why)+'<div class="dim">'+esc(e.route)+(e.detail?' · '+esc(e.detail):'')+'</div></td><td class="hide">'+esc([e.expected,e.actual].filter(Boolean).join(' → '))+'</td><td class="hide">'+(e.ms!=null?Math.round(e.ms/100)/10+' s':'')+'</td></tr>').join('');
}
$('go').onclick=load;load();
</script></body></html>`;
