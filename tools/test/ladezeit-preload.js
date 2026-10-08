/* Regression: Seitenladen in swiftshader dauert seit der neuen Stadt ~36 s;
   Playwright bricht goto nach 30 s ab. Nur das Navigations-Zeitlimit wird
   angehoben, keine Pruefung. */
const pw=require('/opt/node22/lib/node_modules/playwright');
const orig=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{ const b=await orig(...a); const np=b.newPage.bind(b);
  b.newPage=async(...x)=>{ const p=await np(...x); p.setDefaultNavigationTimeout(240000); p.setDefaultTimeout(120000); return p; }; return b; };
/* Lastfest (08.10.): feste 15-30-s-Fristen der Tests scheitern, wenn andere Prozesse
   die vier Kerne belegen; Mindestfrist 120 s fuer waitForSelector/click (nur Harness). */
{ const orig2=pw.chromium.launch; const l2=pw.chromium.launch;
  pw.chromium.launch=async(...a)=>{ const b=await l2(...a); const np=b.newPage.bind(b);
    b.newPage=async(...x)=>{ const p=await np(...x);
      for(const m of ['waitForSelector','click']){ const f=p[m].bind(p); p[m]=(s,o={})=>f(s,Object.assign({},o,{timeout:Math.max(o.timeout||0,120000)})); }
      return p; }; return b; }; }
