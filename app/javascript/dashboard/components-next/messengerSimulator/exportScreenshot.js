// Measurements and captures intentionally share one mounted renderer, so they must be sequential.
/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { nextTick } from 'vue';

const MAX_HEIGHT = 8000;
const MAX_PARTS = 100;
const MAX_BYTES = 64 * 1024 * 1024;

export class ScreenshotExportError extends Error {}

const assertCurrent = isCurrent => {
  if (!isCurrent()) throw new ScreenshotExportError('cancelled');
};

const pngBytes = dataUrl => {
  const binary = atob(dataUrl.split(',')[1]);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const download = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Both manual and inbox exports use this exact renderer and authorization boundary.
export const exportScreenshot = async ({
  messages,
  render,
  authorize,
  isCurrent,
  filename,
  onProgress = () => {},
}) => {
  if (!messages.length) throw new ScreenshotExportError('empty');
  await authorize();
  assertCurrent(isCurrent);
  await document.fonts.ready;
  const { toPng } = await import('html-to-image');
  const images = [];
  let page = [];
  let totalBytes = 0;

  const measure = async items => {
    assertCurrent(isCurrent);
    const element = await render(items);
    await nextTick();
    await Promise.all(
      [...element.querySelectorAll('img')].map(img => img.decode())
    );
    assertCurrent(isCurrent);
    return element;
  };

  const capture = async () => {
    if (images.length >= MAX_PARTS) throw new ScreenshotExportError('limit');
    const element = await measure(page);
    if (element.scrollHeight > MAX_HEIGHT)
      throw new ScreenshotExportError('limit');
    const dataUrl = await toPng(element, {
      pixelRatio: 1,
      width: 299,
      height: element.scrollHeight,
      backgroundColor: '#ffffff',
      fontEmbedCSS: '',
      skipAutoScale: true,
    });
    assertCurrent(isCurrent);
    totalBytes += Math.ceil((dataUrl.length * 3) / 4);
    if (totalBytes > MAX_BYTES) throw new ScreenshotExportError('limit');
    images.push(dataUrl);
    onProgress(images.length);
    page = [];
  };

  for (const message of messages) {
    let remainder = { ...message };
    while (remainder) {
      const candidate = [...page, remainder];
      const element = await measure(candidate);
      if (element.scrollHeight <= MAX_HEIGHT) {
        page = candidate;
        remainder = null;
      } else if (page.length) {
        await capture();
      } else {
        // A single real message can contain 150,000 characters. Split by measured
        // height, preserving every Unicode code point instead of truncating text.
        const characters = Array.from(remainder.text);
        let low = 1;
        let high = characters.length - 1;
        let fitting = 0;
        while (low <= high) {
          const middle = Math.floor((low + high) / 2);
          const fragment = {
            ...remainder,
            text: characters.slice(0, middle).join(''),
          };
          const measured = await measure([fragment]);
          if (measured.scrollHeight <= MAX_HEIGHT) {
            fitting = middle;
            low = middle + 1;
          } else {
            high = middle - 1;
          }
        }
        if (!fitting) throw new ScreenshotExportError('limit');
        page = [{ ...remainder, text: characters.slice(0, fitting).join('') }];
        await capture();
        remainder = {
          ...remainder,
          text: characters.slice(fitting).join(''),
          time: '',
        };
      }
    }
  }
  if (page.length) await capture();
  let archive;
  if (images.length > 1) {
    const { zipSync } = await import('fflate');
    assertCurrent(isCurrent);
    const files = Object.fromEntries(
      images.map((dataUrl, index) => [
        `${filename}-${String(index + 1).padStart(3, '0')}.png`,
        pngBytes(dataUrl),
      ])
    );
    archive = new Blob([zipSync(files, { level: 0 })], {
      type: 'application/zip',
    });
  }
  // Recheck the same account AND conversation (when applicable) immediately
  // before delivery, including time spent rendering and packaging multiple PNGs.
  await authorize();
  assertCurrent(isCurrent);
  if (archive) {
    const url = URL.createObjectURL(archive);
    download(url, `${filename}.zip`);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    download(images[0], `${filename}.png`);
  }
  return images.length;
};
