// Run with Node 22+ against a local HTTP server and a Chrome debugging endpoint.
// SITE_URL=http://127.0.0.1:8765/ CHROME_DEBUG_URL=http://127.0.0.1:9232
// Screenshots are written to the system temporary directory, not the repository.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const site = process.env.SITE_URL || 'http://127.0.0.1:8765/';
const debug = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9232';
const pages = await (await fetch(`${debug}/json/list`)).json();
const target = pages.find(page => page.type === 'page');
assert(target, 'Start a headless Chrome instance with remote debugging enabled.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
const errors = [];
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject, timeout } = pending.get(message.id);
    clearTimeout(timeout);
    pending.delete(message.id);
    message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
  }
};
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timeout = setTimeout(() => { pending.delete(key); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(key, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 75));
  }
  throw new Error(`Condition timed out: ${expression}`);
}
async function navigate(path = '') {
  await evaluate(`window.__smokeOldDocument = true`);
  await cdp('Page.navigate', { url: new URL(path, site).href });
  await waitFor(`!window.__smokeOldDocument && location.href === ${JSON.stringify(new URL(path, site).href)} && document.readyState === 'complete'`);
}
async function viewport(width, height) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
}
async function click(selector) {
  const point = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    el.scrollIntoView({block:'center',behavior:'instant'});
    const r = el.getBoundingClientRect();
    return {x:r.x+r.width/2,y:r.y+r.height/2};
  })()`);
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
}
async function key(keyName) {
  const virtualKey = { Escape:27, Tab:9, ArrowLeft:37, ArrowRight:39 }[keyName];
  await cdp('Input.dispatchKeyEvent', { type:'keyDown', key:keyName, code:keyName, windowsVirtualKeyCode:virtualKey });
  await cdp('Input.dispatchKeyEvent', { type:'keyUp', key:keyName, code:keyName, windowsVirtualKeyCode:virtualKey });
}
async function select(selector, value) {
  await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); el.value=${JSON.stringify(value)}; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
}
async function screenshot(name) {
  const { data } = await cdp('Page.captureScreenshot', { format:'png' });
  const path = join(tmpdir(), `dudice-${name}.png`);
  await writeFile(path, Buffer.from(data, 'base64'));
  console.log(`Screenshot: ${path}`);
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await cdp('Network.setCacheDisabled', { cacheDisabled:true });
  // Make sure core interactions survive unavailable third-party resources.
  await cdp('Network.setBlockedURLs', { urls:['*fonts.googleapis.com*','*fonts.gstatic.com*','*cdnjs.cloudflare.com*','*google.com/maps*'] });
  await viewport(1440, 1000);
  await navigate();
  await waitFor(`document.documentElement.classList.contains('js-ready')`);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card').length`), 7);
  assert.equal(await evaluate(`document.querySelectorAll('main h1').length`), 1);
  assert.equal(await evaluate(`document.querySelector('.hero-rate').textContent.includes('₱1,000')`), true);
  await screenshot('desktop');

  for (const width of [1440, 1024, 768, 390, 320]) {
    await viewport(width, 900);
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), `Overflow at ${width}px`);
    assert(await evaluate(`(() => {const r=document.querySelector('.room-img img').getBoundingClientRect(); return Math.abs(r.width/r.height - 1.55) < .02;})()`), `Room photo aspect ratio at ${width}px`);
  }
  console.log('PASS: desktop, tablet, and phone widths have no horizontal overflow.');
  await viewport(390, 844);
  await evaluate(`scrollTo({top:0,behavior:'instant'})`);
  await screenshot('mobile');
  await click('.menu-toggle');
  assert(await evaluate(`document.querySelector('#mobile-menu').open`));
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`), 'true');
  await click('#mobile-menu [data-close]');
  await waitFor(`!document.querySelector('#mobile-menu').open`);
  assert(await evaluate(`document.activeElement === document.querySelector('.menu-toggle')`));
  await click('.menu-toggle');
  await key('Escape');
  await waitFor(`!document.querySelector('#mobile-menu').open`);
  await click('.menu-toggle');
  await evaluate(`document.querySelector('#mobile-menu > a').focus()`);
  await key('Tab');
  assert(await evaluate(`document.querySelector('#mobile-menu').contains(document.activeElement)`));
  await click('#mobile-menu a[href="#rooms"]');
  await waitFor(`!document.querySelector('#mobile-menu').open`);
  assert(await evaluate(`document.activeElement.id === 'rooms'`));
  assert.equal(await evaluate(`document.body.classList.contains('modal-open')`), false);
  console.log('PASS: menu opens, closes by button/Escape/link, traps focus and restores focus.');

  await select('#guest-filter','6');
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.room-card:not([hidden])')].map(c=>c.dataset.room)`), ['Family Room']);
  await select('#guest-filter','9');
  assert.equal(await evaluate(`document.querySelector('#no-rooms').hidden`), false);
  await select('#guest-filter','3');
  await select('#stay-filter','24');
  assert.equal(await evaluate(`document.querySelectorAll('.room-rate[data-duration="12"]:not([hidden])').length`), 0);
  await click('.room-card .room-link');
  await waitFor(`document.querySelector('#inquiry-dialog').open`);
  assert.equal(await evaluate(`document.querySelector('#inquiry-guests').value`), '3');
  assert.equal(await evaluate(`document.querySelector('#inquiry-duration').value`), '24');
  assert.match(await evaluate(`document.querySelector('#inquiry-summary').value`), /Regular Room[\s\S]*24 hours[\s\S]*Guests: 3/);
  assert.match(await evaluate(`document.querySelector('#email-inquiry').href`), /Room%20inquiry/);
  // Clipboard failure is a real fallback guests can encounter on restricted browsers.
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied for test')}}})`);
  await click('#inquiry-form button[type="submit"]');
  await waitFor(`document.querySelector('#copy-status').textContent.includes('copy it manually')`);
  assert(await evaluate(`document.querySelector('#inquiry-summary').selectionEnd > 0`));
  await screenshot('mobile-inquiry');
  await key('Escape');
  await waitFor(`!document.querySelector('#inquiry-dialog').open`);
  console.log('PASS: capacity/rate filters, inquiry context, email link, and clipboard fallback.');

  await click('.room-card .room-img-link');
  await waitFor(`document.querySelector('#gallery-dialog').open && document.querySelector('#gallery-image').naturalWidth > 0`);
  assert.equal(await evaluate(`document.querySelector('#gallery-count').textContent`), '1 of 2');
  await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#gallery-count').textContent`), '2 of 2');
  await key('Escape');
  await waitFor(`!document.querySelector('#gallery-dialog').open`);
  assert(await evaluate(`document.activeElement === document.querySelector('.room-card .room-img-link')`));
  console.log('PASS: gallery image loads, keyboard navigation works, focus returns to photo.');

  await viewport(1440,1000);
  await select('#guest-filter','all');
  await select('#stay-filter','all');
  await evaluate(`document.querySelector('#rooms').scrollIntoView({behavior:'instant'})`);
  await screenshot('rooms');
  await navigate('terms.html');
  assert(await evaluate(`document.querySelector('main').textContent.includes('starts at your actual check-in time')`));
  assert(await evaluate(`document.querySelector('#cancellation') !== null`));
  await navigate('privacy.html');
  assert(await evaluate(`document.querySelector('a[href="index.html"]') !== null`));
  await cdp('Emulation.setScriptExecutionDisabled', { value:true });
  await viewport(390,844);
  await navigate();
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.nav-links')).display === 'none'`), false);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card:not([hidden])').length`), 7);
  assert(await evaluate(`document.querySelector('.room-link').href === 'https://m.me/dudiceinn'`));
  assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  console.log('PASS: policies and no-JavaScript navigation/booking fallbacks.');
  assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
  console.log('All browser smoke checks passed with third-party resources blocked.');
} finally {
  await cdp('Emulation.setScriptExecutionDisabled', { value:false });
  await cdp('Network.setBlockedURLs', { urls:[] });
  socket.close();
}
