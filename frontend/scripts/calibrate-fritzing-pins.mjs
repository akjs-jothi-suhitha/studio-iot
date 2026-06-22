import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/assets/fritzing');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));

function parseViewBox(content) {
  const m = content.match(/viewBox="([^"]+)"/);
  if (!m) return null;
  const [x, y, w, h] = m[1].split(/\s+/).map(Number);
  return { x, y, width: w, height: h };
}

function parseConnectors(content) {
  const pins = [];
  const tagRe = /<(circle|rect)[^>]*id="(connector\d+pin)"[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(content)) !== null) {
    const tag = m[0];
    const id = m[2];
    const num = parseInt(id.replace('connector', '').replace('pin', ''), 10);
    const nameMatch = tag.match(/connectorname="([^"]+)"/i);
    const name = nameMatch ? nameMatch[1] : '';

    let x = 0;
    let y = 0;
    const cx = tag.match(/\bcx="([^"]+)"/);
    const cy = tag.match(/\bcy="([^"]+)"/);
    const rx = tag.match(/\bx="([^"]+)"/);
    const ry = tag.match(/\by="([^"]+)"/);
    const rw = tag.match(/\bwidth="([^"]+)"/);
    const rh = tag.match(/\bheight="([^"]+)"/);

    if (cx && cy) {
      x = parseFloat(cx[1]);
      y = parseFloat(cy[1]);
    } else if (rx && ry) {
      x = parseFloat(rx[1]) + parseFloat((rw && rw[1]) || '1') / 2;
      y = parseFloat(ry[1]) + parseFloat((rh && rh[1]) || '1') / 2;
    }

    pins.push({ id, num, x, y, name });
  }

  pins.sort((a, b) => a.num - b.num);
  return pins;
}

const output = {};

for (const file of files) {
  const key = file.replace('.svg', '');
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  output[key] = {
    viewBox: parseViewBox(content),
    pins: parseConnectors(content),
  };
}

console.log(JSON.stringify(output, null, 2));
