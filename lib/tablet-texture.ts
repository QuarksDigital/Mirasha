// The pressed-herb surface of the Ashwagandha tablets (PillScene).

export const TABLET_BASE = "#b08a5e";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Warm brown powder with fine darker and lighter flecks of ground root, tiling. */
export function paintTabletTexture(size: number, base = TABLET_BASE) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const rand = mulberry32(7);
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const k = (rand() - 0.5) * 26; // powder grain
    img.data[i] += k;
    img.data[i + 1] += k * 0.9;
    img.data[i + 2] += k * 0.75;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < size * 1.6; i++) {
    const dark = rand() < 0.65;
    g.fillStyle = dark ? `rgba(70, 44, 22, ${0.35 + rand() * 0.45})` : `rgba(236, 214, 176, ${0.35 + rand() * 0.4})`;
    g.beginPath();
    g.arc(rand() * size, rand() * size, (0.4 + rand() * 1.1) * (size / 256), 0, Math.PI * 2);
    g.fill();
  }
  return c;
}
