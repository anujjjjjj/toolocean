/** Screenshots a specific element, by CSS selector, from the built site. */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, writeFileSync } from "node:fs";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT ?? 9345);
const BASE = `http://localhost:${process.env.BASE_PORT ?? 4177}`;
const [width, route, selector, name] = process.argv.slice(2);
mkdirSync(".screenshots", { recursive: true });
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`,"--headless=new","--disable-gpu","--no-first-run","--hide-scrollbars",`--user-data-dir=/tmp/cdp-rg-${Date.now()}`,"about:blank"],{stdio:"ignore"});
await sleep(6000);
const t = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`,{method:"PUT"})).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); let id=0; const pending=new Map();
await new Promise(r=>ws.onopen=r);
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
const send=(m,p={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}));});
const ev=async x=>(await send("Runtime.evaluate",{expression:x,returnByValue:true})).result?.value;
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:Number(width),height:900,deviceScaleFactor:2,mobile:Number(width)<700});
await send("Page.navigate",{url:BASE+route}); await sleep(3500);
const box = JSON.parse(await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});
 if(!e) return "null"; const r=e.getBoundingClientRect();
 return JSON.stringify({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height});})()`));
if (!box) { console.error("selector not found: " + selector); process.exit(1); }
const shot = await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,
  clip:{x:box.x,y:box.y,width:box.width,height:Math.min(box.height,4000),scale:2}});
writeFileSync(`.screenshots/${name}.png`, Buffer.from(shot.data,"base64"));
console.log(`  .screenshots/${name}.png  (${Math.round(box.width)}x${Math.round(box.height)})`);
ws.close(); chrome.kill();
