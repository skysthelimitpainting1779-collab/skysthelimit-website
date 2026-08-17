import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const defaultRoutes = [
  '/',
  '/residential',
  '/commercial',
  '/public-sector',
  '/projects',
  '/capabilities',
  '/service-area',
  '/about',
  '/contact',
  '/estimate',
  '/refer',
  '/review',
  '/painting-services/interior-painting',
  '/service-areas/inver-grove-heights',
];

const viewports = {
  desktop: { width: 1440, height: 1200 },
  mobile: { width: 390, height: 844 },
};

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

function fileSlug(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '--');
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForFile(path, timeout = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeout) {
    if (existsSync(path)) {
      try {
        return readFileSync(path, 'utf8');
      } catch (error) {
        if (error?.code !== 'EBUSY' && error?.code !== 'EACCES') throw error;
      }
    }
    if (Date.now() - startedAt > timeout) throw new Error(`Timed out waiting for ${path}.`);
    await wait(50);
  }
  throw new Error(`Timed out waiting for ${path}.`);
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }

    const eventListeners = listeners.get(message.method) ?? [];
    listeners.delete(message.method);
    eventListeners.forEach((resolve) => resolve(message.params));
  });

  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method) {
      return new Promise((resolve) => {
        listeners.set(method, [...(listeners.get(method) ?? []), resolve]);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function waitForPageReady(cdp, expectedUrl, timeout = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeout) {
    const response = await cdp.send('Runtime.evaluate', {
      expression: `({
        href: location.href,
        navigationUrl: performance.getEntriesByType('navigation')[0]?.name ?? '',
        readyState: document.readyState,
        headerHeight: document.querySelector('.conversion-header')?.getBoundingClientRect().height ?? 0,
        mainHeight: document.querySelector('#main-content')?.getBoundingClientRect().height ?? 0,
      })`,
      returnByValue: true,
    });
    const state = response.result?.value;
    if (
      state?.href === expectedUrl
      && state.navigationUrl === expectedUrl
      && state.readyState === 'complete'
      && state.headerHeight >= 100
      && state.mainHeight >= 300
    ) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for a stable render of ${expectedUrl}.`);
}

const baseUrl = new URL(readArg('base-url', 'http://localhost:3000'));
if (!['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname)) {
  throw new Error('Safety stop: --base-url must use localhost or a loopback address.');
}

const requestedMode = readArg('mode', 'both');
const modes = requestedMode === 'both' ? ['desktop', 'mobile'] : [requestedMode];
if (modes.some((mode) => !viewports[mode])) {
  throw new Error('--mode must be desktop, mobile, or both.');
}
const fullPage = readArg('full-page', 'false') === 'true';

const routes = readArg('routes', '')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);
const selectedRoutes = routes.length ? routes : defaultRoutes;
if (selectedRoutes.some((route) => !route.startsWith('/') || route.startsWith('//'))) {
  throw new Error('Every route must be a root-relative public path.');
}

const browser = findBrowser();
if (!browser) throw new Error('Chrome or Edge was not found. Set CHROME_PATH and retry.');

const response = await fetch(baseUrl);
if (!response.ok) throw new Error(`Local site returned HTTP ${response.status}.`);

const stamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
const outputDirectory = readArg('output', join(tmpdir(), `skys-public-audit-${stamp}`));
mkdirSync(outputDirectory, { recursive: true });

// Chrome's Windows CLI enforces a 500px minimum CSS viewport even when
// --window-size=390 is supplied, which produces deceptive cropped "mobile"
// screenshots. DevTools device metrics guarantee the requested CSS viewport.
// Each capture gets its own process because Windows headless Chrome can retain
// stale fixed-position compositor layers when several routes share a target.
for (const mode of modes) {
  const viewport = viewports[mode];
  for (const route of selectedRoutes) {
    const output = join(outputDirectory, `${fileSlug(route)}--${mode}.png`);
    const url = new URL(route, baseUrl).toString();
    const browserProfile = mkdtempSync(join(tmpdir(), 'skys-visual-audit-chrome-'));
    const devToolsPortFile = join(browserProfile, 'DevToolsActivePort');
    const chrome = spawn(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${browserProfile}`,
      'about:blank',
    ], { stdio: 'ignore', windowsHide: true });

    try {
      const [port] = (await waitForFile(devToolsPortFile)).trim().split(/\r?\n/);
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((result) => result.json());
      const pageTarget = targets.find((target) => target.type === 'page');
      if (!pageTarget?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a page target.');

      const cdp = await connectCdp(pageTarget.webSocketDebuggerUrl);
      try {
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Emulation.setScrollbarsHidden', { hidden: true });
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          mobile: mode === 'mobile',
          screenWidth: viewport.width,
          screenHeight: viewport.height,
        });
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mode === 'mobile' });
        await cdp.send('Page.navigate', { url });
        await waitForPageReady(cdp, url);
        await cdp.send('Page.bringToFront');
        await cdp.send('Runtime.evaluate', {
          expression: `(async () => {
            const images = [...document.images].map((image) => image.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  image.addEventListener('load', resolve, { once: true });
                  image.addEventListener('error', resolve, { once: true });
                }));
            await Promise.race([
              Promise.all([document.fonts.ready, ...images]),
              new Promise((resolve) => setTimeout(resolve, 4000)),
            ]);
          })()`,
          awaitPromise: true,
        });
        await cdp.send('Runtime.evaluate', {
          expression: 'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
          awaitPromise: true,
        });
        await wait(500);
        const screenshotOptions = {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: fullPage,
        };
        if (fullPage) {
          const metrics = await cdp.send('Page.getLayoutMetrics');
          const content = metrics.cssContentSize ?? metrics.contentSize;
          screenshotOptions.clip = {
            x: 0,
            y: 0,
            width: viewport.width,
            height: Math.ceil(content.height),
            scale: 1,
          };
        }
        const screenshot = await cdp.send('Page.captureScreenshot', screenshotOptions);
        writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
      } finally {
        cdp.close();
      }
    } finally {
      if (chrome.exitCode === null) {
        chrome.kill();
        await new Promise((resolve) => chrome.once('exit', resolve));
      }
      await wait(250);
      try {
        rmSync(browserProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch (error) {
        // Chrome crash handlers can briefly retain a Windows profile handle.
        // The OS temp directory remains the only cleanup scope.
        if (error?.code !== 'EPERM' && error?.code !== 'EBUSY') throw error;
      }
    }

    if (!existsSync(output) || statSync(output).size === 0) {
      throw new Error(`Capture failed for ${route} at ${mode}.`);
    }
  }
}

console.log(outputDirectory);
