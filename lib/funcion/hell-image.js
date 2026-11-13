import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const TEMPLATE_URL = new URL('../../src/assets/images/hell-template.png', import.meta.url);
const PANEL = { left: 550, top: 31, width: 1190, height: 825 };
let templatePromise;

export async function composeHellImage(photo) {
  templatePromise ||= readFile(TEMPLATE_URL);
  const template = await templatePromise;
  const screenshot = await sharp(photo)
    .rotate()
    .resize(PANEL.width, PANEL.height, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  const { width, height } = await sharp(screenshot).metadata();
  return sharp(template)
    .composite([{
      input: screenshot,
      left: PANEL.left + Math.floor((PANEL.width - width) / 2),
      top: PANEL.top + Math.floor((PANEL.height - height) / 2)
    }])
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();
}
