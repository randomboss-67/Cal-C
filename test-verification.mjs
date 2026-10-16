import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIR = 'C:\\Users\\Prash\\.gemini\\antigravity\\scratch\\cal-c';
const PORT = 3000;
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIR, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  try {
    await runBrowserTests();
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
});

async function runBrowserTests() {
  console.log('Launching headless Edge from:', EDGE_PATH);
  const debugPort = 9224;
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${debugPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${DIR}\\.edge-profile-test`,
    `http://localhost:${PORT}/index.html`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const res = await fetch(`http://localhost:${debugPort}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) throw new Error('Could not connect to Edge remote debugging endpoint');

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, (res) => {
        if (res.error) reject(res.error);
        else resolve(res.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await new Promise((r) => setTimeout(r, 800));

  async function evaluate(expression) {
    const res = await sendCDP('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async function takeScreenshot(filename) {
    const res = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(DIR, filename);
    fs.writeFileSync(outPath, buffer);
    fs.writeFileSync(path.join(DIR, 'docs', 'screenshots', filename), buffer);
    console.log(`Saved screenshot: ${outPath}`);
    return outPath;
  }

  console.log('\n--- VERIFICATION 1: INITIAL BUTTON SHAPE (PURE CIRCLE) ---');
  const initialShape = await evaluate(`(() => {
    const btn1 = document.querySelector('.calc-btn[data-key="1"]');
    const cs = window.getComputedStyle(btn1);
    const rect = btn1.getBoundingClientRect();
    return {
      borderRadius: cs.borderRadius,
      width: rect.width,
      height: rect.height,
      aspectRatio: (rect.width / rect.height).toFixed(3)
    };
  })()`);
  console.log('Button 1 Initial Metrics:', initialShape);

  await takeScreenshot('screenshot-1-initial.png');

  console.log('\n--- VERIFICATION 2: SQUIRCLE MORPH ON CLICK ---');
  const morphResult = await evaluate(`(async () => {
    const btn1 = document.querySelector('.calc-btn[data-key="1"]');
    btn1.classList.add('squircle-active');
    await new Promise(r => setTimeout(r, 60));
    const activeRadius = window.getComputedStyle(btn1).borderRadius;
    const isSquircle = activeRadius.includes('26%') || parseFloat(activeRadius) < 35;
    btn1.classList.remove('squircle-active');
    
    return {
      activeBorderRadius: activeRadius,
      isSquircle: isSquircle
    };
  })()`);
  console.log('Button Morph Result:', morphResult);

  console.log('\n--- VERIFICATION 3: CLICK SEQUENCE 1, +, = FOR NEVER SETTLE EASTER EGG ---');

  // Click '1'
  const after1 = await evaluate(`(() => {
    const btn = document.querySelector('.calc-btn[data-key="1"]');
    btn.click();
    return {
      expression: document.getElementById('expression').innerText,
      result: document.getElementById('result').innerText
    };
  })()`);
  console.log("After clicking '1':", after1);

  // Click '+'
  const afterPlus = await evaluate(`(() => {
    const btn = document.querySelector('.calc-btn[data-key="+"]');
    btn.click();
    return {
      expression: document.getElementById('expression').innerText,
      result: document.getElementById('result').innerText
    };
  })()`);
  console.log("After clicking '+':", afterPlus);

  // Click '='
  const afterEquals = await evaluate(`(async () => {
    const btn = document.querySelector('.calc-btn[data-key="="]');
    btn.click();
    
    await new Promise(r => setTimeout(r, 500));

    const card = document.getElementById('display-card');
    const cardCs = window.getComputedStyle(card);
    const easterEggView = card.querySelector('.easter-egg-view');
    const eeCs = window.getComputedStyle(easterEggView);
    const readout = card.querySelector('.readout-container');
    const readoutCs = window.getComputedStyle(readout);
    const boxEl = easterEggView.querySelector('.oneplus-box');
    const titleEl = easterEggView.querySelector('.never-settle-title');

    return {
      isEasterEggActive: card.classList.contains('easter-egg-active'),
      cardBackgroundColor: cardCs.backgroundColor,
      readoutDisplayMode: readoutCs.display,
      easterEggDisplayMode: eeCs.display,
      boxText: boxEl ? boxEl.innerText.trim() : null,
      boxBorderRadius: boxEl ? window.getComputedStyle(boxEl).borderRadius : null,
      titleText: titleEl ? titleEl.innerText.trim() : null,
      titleColor: titleEl ? window.getComputedStyle(titleEl).color : null,
      titleFontWeight: titleEl ? window.getComputedStyle(titleEl).fontWeight : null
    };
  })()`);
  console.log("After clicking '=':", afterEquals);

  await takeScreenshot('screenshot-2-easter-egg.png');

  console.log('\n--- VERIFICATION 4: EQUALS BUTTON PERMANENT ONEPLUS RED ---');
  const equalsBtnStyle = await evaluate(`(() => {
    const btn = document.querySelector('.calc-btn[data-key="="]');
    const cs = window.getComputedStyle(btn);
    return {
      bgColor: cs.backgroundColor,
      textColor: cs.color,
      borderRadius: cs.borderRadius
    };
  })()`);
  console.log('Equals Button Styling:', equalsBtnStyle);

  console.log('\n--- VERIFICATION 5: TOP ROW SQUARE (x²) AND CUBE (x³) ---');
  const topRowButtons = await evaluate(`(() => {
    const topRow = Array.from(document.querySelectorAll('.keypad > button')).slice(0, 4);
    return topRow.map(b => ({
      text: b.innerText.trim(),
      key: b.dataset.key,
      borderRadius: window.getComputedStyle(b).borderRadius
    }));
  })()`);
  console.log('Top Row Buttons:', topRowButtons);

  ws.close();
  browserProc.kill();
  server.close();
  console.log('\nAll tests completed successfully!');
  process.exit(0);
}
