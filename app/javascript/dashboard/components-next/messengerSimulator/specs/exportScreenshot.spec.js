import { toPng } from 'html-to-image';
import { zipSync } from 'fflate';
import { exportScreenshot, ScreenshotExportError } from '../exportScreenshot';

vi.mock('html-to-image', () => ({ toPng: vi.fn() }));
vi.mock('fflate', () => ({ zipSync: vi.fn() }));

// "QUJD" decodes to the bytes of "ABC", so the zip payload stays assertable.
const PNG = 'data:image/png;base64,QUJD';
const FILENAME = 'messenger-conversation';
const MESSAGE_A = { sender: 'incoming', text: 'A', time: '10:00' };
const MESSAGE_B = { sender: 'outgoing', text: 'B', time: '' };

// The renderer is measured through scrollHeight only, keyed by the rendered page.
const heights = {};
const clicks = [];
let rendered = [];
let current = true;
let authorize;
let onProgress;

const isCurrent = () => current;

const render = vi.fn();

const renderPage = async items => {
  const key = items.map(item => item.text).join('|');
  // An unlisted page means the pagination walk changed: fail loudly instead of
  // measuring undefined, which would compare false against every limit.
  if (!(key in heights)) throw new Error(`Unexpected rendered page: ${key}`);
  const element = document.createElement('div');
  Object.defineProperty(element, 'scrollHeight', {
    value: heights[key],
    configurable: true,
  });
  rendered.push(element);
  return element;
};

const run = (messages, overrides = {}) =>
  exportScreenshot({
    messages,
    render,
    authorize,
    isCurrent,
    filename: FILENAME,
    onProgress,
    ...overrides,
  });

beforeAll(() => {
  Object.defineProperty(document, 'fonts', {
    value: { ready: Promise.resolve() },
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  rendered = [];
  clicks.length = 0;
  current = true;
  Object.keys(heights).forEach(key => delete heights[key]);
  heights.A = 100;
  heights.B = 120;
  authorize = vi.fn().mockResolvedValue(undefined);
  onProgress = vi.fn();
  toPng.mockResolvedValue(PNG);
  zipSync.mockReturnValue(new Uint8Array([80, 75, 3, 4]));
  render.mockImplementation(renderPage);
  // jsdom ships neither of these, so they are installed rather than spied on.
  URL.createObjectURL = vi.fn().mockReturnValue('blob:messenger');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    function captureClick() {
      clicks.push({
        href: this.getAttribute('href'),
        download: this.getAttribute('download'),
        attached: this.isConnected,
      });
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

it('rejects an empty script before authorizing or rendering anything', async () => {
  const error = await run([]).catch(caught => caught);
  expect(error).toBeInstanceOf(ScreenshotExportError);
  expect(error.message).toBe('empty');
  expect(authorize).not.toHaveBeenCalled();
  expect(render).not.toHaveBeenCalled();
});

it('captures with the exact Messenger geometry and downloads a single PNG', async () => {
  const parts = await run([MESSAGE_A]);

  expect(parts).toBe(1);
  expect(toPng).toHaveBeenCalledTimes(1);
  const [element, options] = toPng.mock.calls[0];
  expect(element).toBe(rendered[rendered.length - 1]);
  expect(options).toEqual({
    pixelRatio: 1,
    width: 299,
    height: 100,
    backgroundColor: '#ffffff',
    fontEmbedCSS: '',
    skipAutoScale: true,
  });
  expect(options.height).toBe(element.scrollHeight);
  expect(onProgress.mock.calls).toEqual([[1]]);
  expect(zipSync).not.toHaveBeenCalled();
  expect(clicks).toEqual([
    { href: PNG, download: `${FILENAME}.png`, attached: true },
  ]);
  expect(document.querySelector('a')).toBeNull();
});

it('authorizes exactly twice: before rendering and again before delivery', async () => {
  await run([MESSAGE_A]);

  expect(authorize).toHaveBeenCalledTimes(2);
  expect(authorize.mock.invocationCallOrder[0]).toBeLessThan(
    render.mock.invocationCallOrder[0]
  );
  expect(authorize.mock.invocationCallOrder[1]).toBeGreaterThan(
    toPng.mock.invocationCallOrder[0]
  );
});

it('aborts before rendering when the export is no longer current', async () => {
  current = false;

  const error = await run([MESSAGE_A]).catch(caught => caught);

  expect(error).toBeInstanceOf(ScreenshotExportError);
  expect(error.message).toBe('cancelled');
  expect(authorize).toHaveBeenCalledTimes(1);
  expect(render).not.toHaveBeenCalled();
  expect(toPng).not.toHaveBeenCalled();
  expect(clicks).toEqual([]);
});

it('aborts after the delivery recheck without downloading anything', async () => {
  authorize.mockImplementation(async () => {
    if (authorize.mock.calls.length === 2) current = false;
  });

  const error = await run([MESSAGE_A]).catch(caught => caught);

  expect(error).toBeInstanceOf(ScreenshotExportError);
  expect(error.message).toBe('cancelled');
  expect(authorize).toHaveBeenCalledTimes(2);
  expect(toPng).toHaveBeenCalledTimes(1);
  expect(clicks).toEqual([]);
});

it('paginates oversized scripts into a zip with padded part names', async () => {
  heights['A|B'] = 9000;

  const parts = await run([MESSAGE_A, MESSAGE_B]);

  expect(parts).toBe(2);
  expect(toPng).toHaveBeenCalledTimes(2);
  expect(toPng.mock.calls[0][1].height).toBe(100);
  expect(toPng.mock.calls[1][1].height).toBe(120);
  expect(onProgress.mock.calls).toEqual([[1], [2]]);
  expect(zipSync).toHaveBeenCalledTimes(1);
  const [files, zipOptions] = zipSync.mock.calls[0];
  expect(Object.keys(files)).toEqual([
    `${FILENAME}-001.png`,
    `${FILENAME}-002.png`,
  ]);
  expect(Array.from(files[`${FILENAME}-001.png`])).toEqual([65, 66, 67]);
  expect(zipOptions).toEqual({ level: 0 });
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  expect(URL.createObjectURL.mock.calls[0][0].type).toBe('application/zip');
  expect(clicks).toEqual([
    { href: 'blob:messenger', download: `${FILENAME}.zip`, attached: true },
  ]);
});
