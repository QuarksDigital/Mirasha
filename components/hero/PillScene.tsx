"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { paintTabletTexture } from "@/lib/tablet-texture";

/*
 * A Mirasha Ashwagandha tablets bottle: white HDPE bottle, ribbed green cap, wrap-around
 * Mirasha label. Local +Y is up; the bottle stands on y = 0 and its mouth is at y = MOUTH_Y.
 *
 * Driven by `progress` (0 → 1) from the hero ScrollTrigger:
 *   0.00        standing still (right of the copy on wide screens, below it on phones)
 *   0.00–0.12   rises to the centre of the screen
 *   0.05–0.16   cap unscrews, lifts off and flies away
 *   0.08–0.19   bottle tips over to the left until the open mouth faces down
 *   0.19–0.26   tablets pour out one after another (nearest the mouth first), fall under
 *               gravity, strike an invisible floor and rebound straight at the camera,
 *               filling the screen (projectile motion, see the tablet loop)
 *   0.32–0.40   focus pulls onto the near tablets; the bottle behind blurs (PelletFocus)
 *   0.29–0.42   empty bottle lifts out of frame (the hero fades to tablet colour over 0.39–0.44)
 */

const PelletFocus = lazy(() => import("./PelletFocus"));

const R = 1; // bottle radius
const BODY_TOP = 2.2; // straight wall ends, shoulder begins
const NECK_R = 0.66;
const NECK_Y = 2.58; // shoulder ends, neck begins
const MOUTH_Y = 2.86;
const WALL = 0.06;
const CAP_R = 0.74;
const CAP_H = 0.5;
const CAP_Y = 2.5; // cap bottom
const LABEL_Y0 = 0.38;
const LABEL_Y1 = 1.98;
const CENTER_Y = 1.5; // the bottle is drawn centred on this height
const CAMERA_Z = 11;
const FOV = 32;
const BRAND_GREEN = "#1a4331"; // Mirasha brand green (same as the footer)
const GOLD = "#c9a45c";

const RISE_END = 0.12;
const CAP_START = 0.05;
const CAP_END = 0.16;
const TILT_START = 0.08;
const TILT_END = 0.19;
const TILT = 2.55; // radians, counter-clockwise: the top swings left and ends up pointing down
const EMIT_START = 0.19;
const EMIT_SPAN = 0.07; // tablets leave one after another over this window, nearest-the-mouth first
const EXIT_SPEED = 6; // bottle units / s as a tablet slides out of the mouth - the fall starts at this speed

// The fall and rebound are simulated in seconds; progress maps to time at this rate, which with
// the hero's auto-play (FULL_PLAY_S in Hero.tsx) is about real time.
const SIM_SECONDS_PER_PROGRESS = 4.5;
const GRAVITY = 16; // world units / s², scaled with the bottle

// Phones and touch tablets get a lighter scene: fewer tablets, lower pixel ratio.
// Module is client-only (loaded with ssr: false).
const LOW_POWER = window.matchMedia("(pointer: coarse)").matches;
const TABLETS = LOW_POWER ? 700 : 1300;
const PACK_ATTEMPTS = LOW_POWER ? 40000 : 100000; // more attempts → denser fill

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Closed lathe profile with wall thickness: rounded base, straight wall, shoulder, neck and lip. */
function bottleGeometry() {
  const pts: THREE.Vector2[] = [];
  const corner = 0.16;
  pts.push(new THREE.Vector2(1e-4, 0));
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R - corner + Math.cos(a) * corner, corner + Math.sin(a) * corner));
  }
  pts.push(new THREE.Vector2(R, BODY_TOP));
  for (let i = 1; i <= 16; i++) {
    // shoulder: smooth S-curve from the wall in to the neck
    const t = i / 16;
    const e = t * t * (3 - 2 * t);
    pts.push(new THREE.Vector2(R + (NECK_R - R) * e, BODY_TOP + (NECK_Y - BODY_TOP) * t));
  }
  pts.push(new THREE.Vector2(NECK_R, MOUTH_Y - 0.02));
  pts.push(new THREE.Vector2(NECK_R - 0.02, MOUTH_Y));
  pts.push(new THREE.Vector2(NECK_R - WALL + 0.01, MOUTH_Y));
  pts.push(new THREE.Vector2(NECK_R - WALL, MOUTH_Y - 0.02));
  pts.push(new THREE.Vector2(NECK_R - WALL, NECK_Y));
  pts.push(new THREE.Vector2(R - WALL, BODY_TOP));
  pts.push(new THREE.Vector2(R - WALL, WALL + corner));
  pts.push(new THREE.Vector2(R - WALL - corner, WALL));
  pts.push(new THREE.Vector2(1e-4, WALL));
  const geo = new THREE.LatheGeometry(pts, LOW_POWER ? 72 : 128);
  geo.computeVertexNormals();
  return geo;
}

/** Child-resistant cap: ribbed side, slightly domed top, open underneath. */
function capGeometry() {
  const seg = LOW_POWER ? 120 : 240;
  const geo = new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_H, seg, 6, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const rr = Math.hypot(v.x, v.z);
    if (rr > CAP_R * 0.99 && Math.abs(v.y) < CAP_H / 2 - 0.04) {
      // grip ribs
      const a = Math.atan2(v.z, v.x);
      const k = 1 + 0.018 * Math.max(0, Math.cos(a * 72));
      v.x *= k;
      v.z *= k;
    } else if (v.y > CAP_H / 2 - 1e-3) {
      v.y += 0.03 * (1 - (rr / CAP_R) ** 2); // gentle dome
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.translate(0, CAP_H / 2, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Ashwagandha tablet: a pressed biconvex disc - shallow domed faces meeting a narrow band
 * edge with softly rounded corners, like a real compressed tablet.
 */
function tabletGeometry() {
  const pts: THREE.Vector2[] = [];
  const band = 0.16; // half-height of the straight edge
  const corner = 0.1;
  const dome = 0.2; // how far the face bulges above the edge
  const face = 12;
  for (let i = 0; i <= face; i++) {
    const x = (i / face) * (1 - corner);
    pts.push(new THREE.Vector2(Math.max(1e-4, x), band + corner * 0.4 + dome * (1 - (x / (1 - corner)) ** 2)));
  }
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(1 - corner + Math.sin(a) * corner, band + Math.cos(a) * corner * 0.4));
  }
  const n = pts.length;
  for (let i = n - 1; i >= 0; i--) pts.push(new THREE.Vector2(pts[i].x, -pts[i].y)); // mirror for the underside
  const geo = new THREE.LatheGeometry(pts, LOW_POWER ? 28 : 44);
  geo.computeVertexNormals();
  return geo;
}

/** Pressed-herb tablet texture (shared with the hero's fade layer); also the bump map. */
function makeTabletTexture() {
  const tex = new THREE.CanvasTexture(paintTabletTexture(LOW_POWER ? 128 : 256));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Soft pool of light on the floor under the standing bottle, like a product shot. */
function makeFloorGlow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255, 244, 222, 0.16)");
  grad.addColorStop(0.45, "rgba(255, 244, 222, 0.06)");
  grad.addColorStop(1, "rgba(255, 244, 222, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Random packing of tablets inside the bottle. Uses a numeric spatial grid (linked list
 * per cell) — ~12× faster than string-keyed maps, which kept the main thread busy on load.
 */
function packBottle(rand: () => number, { radius, yMin, yMax, target }: { radius: number; yMin: number; yMax: number; target: number }) {
  const rMin = 0.1, rMax = 0.125;
  const cell = rMax * 2;
  const nx = Math.ceil((2 * radius) / cell) + 1, ny = Math.ceil((yMax - yMin) / cell) + 1, nz = nx;
  const head = new Int32Array(nx * ny * nz).fill(-1); // first point in each cell
  const next = new Int32Array(target).fill(-1); // next point in the same cell
  const pts = new Float32Array(target * 4); // x, y, z, r
  let n = 0;
  for (let attempt = 0; attempt < PACK_ATTEMPTS && n < target; attempt++) {
    const r = rMin + rand() * (rMax - rMin);
    const x = (rand() * 2 - 1) * radius;
    const z = (rand() * 2 - 1) * radius;
    const y = yMin + r + rand() * (yMax - yMin - 2 * r);
    const lim = radius - r;
    if (x * x + z * z > lim * lim) continue;
    const gx = Math.floor((x + radius) / cell), gy = Math.floor((y - yMin) / cell), gz = Math.floor((z + radius) / cell);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) {
      const cx = gx + dx;
      if (cx < 0 || cx >= nx) continue;
      for (let dy = -1; dy <= 1 && ok; dy++) {
        const cy = gy + dy;
        if (cy < 0 || cy >= ny) continue;
        for (let dz = -1; dz <= 1 && ok; dz++) {
          const cz = gz + dz;
          if (cz < 0 || cz >= nz) continue;
          for (let j = head[(cx * ny + cy) * nz + cz]; j !== -1; j = next[j]) {
            const ex = pts[j * 4] - x, ey = pts[j * 4 + 1] - y, ez = pts[j * 4 + 2] - z;
            // tablets are flat discs: allow them closer than two full radii
            const min = (pts[j * 4 + 3] + r) * 0.8;
            if (ex * ex + ey * ey + ez * ez < min * min) { ok = false; break; }
          }
        }
      }
    }
    if (!ok) continue;
    const c = (gx * ny + gy) * nz + gz;
    next[n] = head[c];
    head[c] = n;
    pts.set([x, y, z, r], n * 4);
    n++;
  }
  return pts.subarray(0, n * 4);
}

function makeBackdrop() {
  const c = document.createElement("canvas");
  c.width = c.height = LOW_POWER ? 512 : 1024;
  const s = c.width / 1024;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(512 * s, 470 * s, 0, 512 * s, 512 * s, 560 * s);
  grad.addColorStop(0, "#1c1b19");
  grad.addColorStop(0.5, "#0b0b0a");
  grad.addColorStop(1, "#000000");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The Mirasha wrap-around label, drawn on a canvas. The front panel (centre of the canvas)
 * carries the gold Mirasha logo and the product name; the side panels carry the details.
 * The logo PNG is white on transparent, so it's tinted gold once it loads.
 */
function makeLabelTexture() {
  const W = LOW_POWER ? 2048 : 4096;
  const H = Math.round((W * (LABEL_Y1 - LABEL_Y0)) / (2 * Math.PI * R)); // keep texels square on the cylinder
  const k = W / 4096;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const serif = "'Cormorant Garamond', 'Times New Roman', Georgia, serif";
  const sans = "Inter, 'Helvetica Neue', Arial, sans-serif";
  const cx = W / 2; // front of the bottle

  const draw = (logo?: HTMLCanvasElement) => {
    // green wrap with fine gold rules top and bottom
    g.fillStyle = BRAND_GREEN;
    g.fillRect(0, 0, W, H);
    const shade = g.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(255,255,255,0.05)");
    shade.addColorStop(1, "rgba(0,0,0,0.12)");
    g.fillStyle = shade;
    g.fillRect(0, 0, W, H);
    g.fillStyle = GOLD;
    g.fillRect(0, 26 * k, W, 5 * k);
    g.fillRect(0, 40 * k, W, 1.5 * k);
    g.fillRect(0, H - 31 * k, W, 5 * k);
    g.fillRect(0, H - 41.5 * k, W, 1.5 * k);

    g.textAlign = "center";
    g.textBaseline = "middle";

    // front panel
    if (logo) {
      const lw = 620 * k;
      const lh = (lw * logo.height) / logo.width;
      g.drawImage(logo, cx - lw / 2, H * 0.12, lw, lh);
    } else {
      g.fillStyle = GOLD;
      g.font = `600 ${120 * k}px ${serif}`;
      g.fillText("MIRASHA", cx, H * 0.24);
    }
    g.fillStyle = "#e8dcc0";
    g.font = `italic 500 ${54 * k}px ${serif}`;
    g.fillText("The Art of Inner Harmony", cx, H * 0.43);
    g.fillStyle = GOLD;
    g.fillRect(cx - 170 * k, H * 0.5, 340 * k, 2 * k);
    g.fillStyle = "#ffffff";
    g.font = `600 ${118 * k}px ${serif}`;
    g.fillText("ASHWAGANDHA", cx, H * 0.62);
    g.fillStyle = "#e8dcc0";
    g.font = `500 ${36 * k}px ${sans}`;
    g.fillText("WITHANIA SOMNIFERA  ·  STRESS · ENERGY · VITALITY", cx, H * 0.75);
    g.fillStyle = GOLD;
    g.font = `600 ${40 * k}px ${sans}`;
    g.fillText("60 TABLETS  ·  500 mg", cx, H * 0.86);

    // side panels
    const side = (x: number, lines: [string, number, string][]) => {
      let y = H * 0.25;
      for (const [text, size, color] of lines) {
        g.fillStyle = color;
        g.font = `500 ${size * k}px ${sans}`;
        g.fillText(text, x, y);
        y += size * k * 1.9;
      }
    };
    side(cx - 1150 * k, [
      ["AYURVEDIC PROPRIETARY MEDICINE", 30, GOLD],
      ["Supports a calm mind,", 34, "#f3ecdb"],
      ["restful sleep and", 34, "#f3ecdb"],
      ["everyday strength.", 34, "#f3ecdb"],
      ["Dosage: 1 tablet twice daily", 28, "#cfc4a6"],
      ["after meals, or as directed.", 28, "#cfc4a6"],
    ]);
    side(cx + 1150 * k, [
      ["100% VEGETARIAN · GMP CERTIFIED", 30, GOLD],
      ["Made in India", 34, "#f3ecdb"],
      ["Store in a cool, dry place.", 30, "#cfc4a6"],
      ["Keep out of reach of children.", 30, "#cfc4a6"],
      ["www.mirasha.in", 34, GOLD],
    ]);
    tex.needsUpdate = true;
  };

  draw();
  const img = new Image();
  img.onload = () => {
    const tint = document.createElement("canvas");
    tint.width = img.naturalWidth;
    tint.height = img.naturalHeight;
    const t = tint.getContext("2d")!;
    t.drawImage(img, 0, 0);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = GOLD;
    t.fillRect(0, 0, tint.width, tint.height);
    draw(tint);
  };
  img.src = "/brand/mirasha-logo.png";
  return tex;
}

interface SceneProps {
  progress: React.RefObject<number>;
  onPillClick: () => void;
}

function Bottle({ progress, onPillClick }: SceneProps) {
  const rig = useRef<THREE.Group>(null!); // position + scale (rise to centre)
  const tilt = useRef<THREE.Group>(null!); // tipping over
  const cap = useRef<THREE.Group>(null!);
  const tablets = useRef<THREE.InstancedMesh>(null!);
  const lastP = useRef(-1);
  const look = useRef({ x: 0, y: 0 }); // smoothed pointer, for the bottle turning towards the mouse
  const floorGlow = useRef<THREE.MeshBasicMaterial>(null!);
  const floorShadow = useRef<THREE.ShadowMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const { size, viewport } = useThree();

  const bottleGeo = useMemo(() => bottleGeometry(), []);
  const capGeo = useMemo(() => capGeometry(), []);
  const tabletGeo = useMemo(() => tabletGeometry(), []);
  const backdrop = useMemo(() => makeBackdrop(), []);
  const label = useMemo(() => makeLabelTexture(), []);
  const tabletTex = useMemo(() => makeTabletTexture(), []);
  const glowTex = useMemo(() => makeFloorGlow(), []);

  const data = useMemo(() => {
    const rand = mulberry32(11);
    const pts = packBottle(rand, { radius: R - WALL - 0.02, yMin: WALL, yMax: BODY_TOP - 0.04, target: TABLETS });
    const count = pts.length / 4;
    const start = new Float32Array(count * 3);
    const radius = new Float32Array(count);
    const mouthJit = new Float32Array(count * 3);
    const order = new Array<{ i: number; d: number }>(count);
    for (let i = 0; i < count; i++) {
      start.set([pts[i * 4], pts[i * 4 + 1], pts[i * 4 + 2]], i * 3);
      radius[i] = pts[i * 4 + 3];
      const a = rand() * Math.PI * 2, m = Math.sqrt(rand()) * (NECK_R - WALL - 0.12);
      mouthJit.set([Math.cos(a) * m, MOUTH_Y + 0.1, Math.sin(a) * m], i * 3);
      // the bottle is upside down when they pour: those nearest the mouth come out first
      order[i] = { i, d: MOUTH_Y - pts[i * 4 + 1] + rand() * 0.6 };
    }
    order.sort((a, b) => a.d - b.d);
    const delay = new Float32Array(count);
    order.forEach(({ i }, rank) => (delay[i] = EMIT_START + (rank / count) * EMIT_SPAN));
    const closing = new Uint8Array(count); // the last ~8% out: they end up covering the lens completely
    order.forEach(({ i }, rank) => (closing[i] = rank > count * 0.92 ? 1 : 0));

    const depth = new Float32Array(count);
    const ndc = new Float32Array(count * 2);
    const spread = new Float32Array(count * 3);
    const flight = new Float32Array(count);
    const axis2 = new Float32Array(count * 3);
    const omega = new Float32Array(count);
    const axis = new Float32Array(count * 3);
    const quat0 = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      depth[i] = closing[i] ? 0.96 + rand() * 0.04 : Math.pow(rand(), 0.4); // biased close to the lens so the frame fills edge to edge
      // aim past the frame edges so the rebounds fan out across the whole screen, not just near the end
      const reach = closing[i] ? 0.35 : 1;
      ndc[i * 2] = (rand() * 3.4 - 1.7) * reach;
      ndc[i * 2 + 1] = (rand() * 3 - 1.4) * reach;
      // extra velocity on top of the pour: a little sideways scatter and lift
      v.set((rand() - 0.5) * 3.2, rand() * 0.5, (rand() - 0.5) * 1.8);
      spread.set([v.x, v.y, v.z], i * 3);
      v.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      axis.set([v.x, v.y, v.z], i * 3);
      v.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      axis2.set([v.x, v.y, v.z], i * 3);
      omega[i] = 4 + rand() * 7; // tumble rate, rad/s
      q.setFromEuler(e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28));
      quat0.set([q.x, q.y, q.z, q.w], i * 4);
      flight[i] = 0.22 + rand() * 0.12; // seconds from the floor to the lens
      // slight batch-to-batch variation on top of the herb texture
      color.setHSL(0.09, 0.1 + rand() * 0.15, 0.82 + rand() * 0.16);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    return { count, start, radius, mouthJit, delay, depth, ndc, spread, flight, axis, axis2, omega, quat0, colors };
  }, []);

  // world-space landing spots spread across the view frustum
  const targets = useMemo(() => {
    const t = new Float32Array(data.count * 3);
    const aspect = size.width / size.height;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    for (let i = 0; i < data.count; i++) {
      const dist = THREE.MathUtils.lerp(5, 0.45, data.depth[i]);
      const halfH = dist * tan;
      t[i * 3] = data.ndc[i * 2] * halfH * aspect;
      t[i * 3 + 1] = data.ndc[i * 2 + 1] * halfH;
      t[i * 3 + 2] = CAMERA_Z - dist;
    }
    return t;
  }, [data, size.width, size.height]);

  useEffect(() => {
    lastP.current = -1; // targets moved: recompute every tablet on the next frame
  }, [targets]);

  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      p: new THREE.Vector3(),
      mj: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      pour: new THREE.Matrix4(),
      pourQ: new THREE.Quaternion(),
      pourE: new THREE.Euler(),
      pourP: new THREE.Vector3(),
      pourS: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      q0: new THREE.Quaternion(),
      spin: new THREE.Quaternion(),
      ax: new THREE.Vector3(),
      s: new THREE.Vector3(),
    }),
    []
  );

  // Must match the `side` variant in globals.css: landscape ≥768px puts the text left and the bottle right;
  // below that the text sits on top and the bottle below it. It rises to the centre as the sequence starts.
  const wide = size.width >= 768 && size.width / size.height >= 1.2;
  const baseScale = wide
    ? Math.min(1, viewport.width / 11, (viewport.height * 0.52) / MOUTH_Y)
    : Math.min(1, viewport.width / 5.2, (viewport.height * 0.32) / MOUTH_Y);
  const baseX = wide ? viewport.width * 0.2 : 0;
  const baseY = wide ? -viewport.height * 0.02 : -viewport.height * 0.25;

  const floorY = baseY - CENTER_Y * baseScale; // where the standing bottle's base meets the floor

  useFrame((state) => {
    const p = progress.current ?? 0;
    const rise = smoothstep(0, RISE_END, p);
    const idle = 1 - rise;
    const hover = hovered && p < 0.01 ? 1.04 : 1;
    // While it stands, the bottle turns gently to follow the mouse (more when hovered) and the
    // label catches the light; the effect hands over to the scroll animation as it rises.
    const reach = hovered ? 1 : 0.55;
    look.current.x = THREE.MathUtils.lerp(look.current.x, state.pointer.x * reach * idle, 0.06);
    look.current.y = THREE.MathUtils.lerp(look.current.y, state.pointer.y * reach * idle, 0.06);
    floorGlow.current.opacity = idle;
    floorShadow.current.opacity = 0.55 * idle;
    const out = smoothstep(0.29, 0.42, p);

    // lifts up and away at the end so it never passes through the tablets on the floor
    rig.current.position.set(baseX * (1 - rise), baseY * (1 - rise) + rise * 0.15 + out * viewport.height * 0.9, -out * 3);
    rig.current.scale.setScalar(THREE.MathUtils.lerp(rig.current.scale.x, baseScale * (1 + rise * 0.12) * hover, 0.15));
    rig.current.rotation.y = -0.32 * idle + look.current.x * 0.5; // label turned a touch towards the copy while standing
    rig.current.rotation.x = -look.current.y * 0.16;

    tilt.current.rotation.z = TILT * smoothstep(TILT_START, TILT_END, p);

    // cap: unscrew (spin + lift along the neck), then fall away to the right
    const unscrew = smoothstep(CAP_START, CAP_START + 0.05, p);
    const away = smoothstep(CAP_START + 0.04, CAP_END, p);
    cap.current.rotation.y = unscrew * 4;
    cap.current.position.set(away * 5, CAP_Y + unscrew * 0.35 + away * 3, -away * 2);
    cap.current.rotation.z = away * 1.4;
    cap.current.visible = p < CAP_END;

    // Tablets only move with `p` (and the layout), so there's nothing to do while the bottle stands still.
    if (p === lastP.current) return;
    lastP.current = p;

    tilt.current.updateWorldMatrix(true, false);
    const mw = tilt.current.matrixWorld;
    const ws = mw.getMaxScaleOnAxis();
    // The bottle's pose while it pours (risen to the centre, fully tipped). Tablets leave the mouth
    // from this fixed pose, so ones already in the air aren't dragged along when the bottle lifts away.
    tmp.pourQ.setFromEuler(tmp.pourE.set(0, 0, TILT));
    tmp.pour.compose(tmp.pourP.set(0, 0.15, 0), tmp.pourQ, tmp.pourS.setScalar(baseScale * 1.12));
    const { start, radius, mouthJit, delay, spread, flight, axis, axis2, omega, quat0, count } = data;
    const g = GRAVITY * ws;
    const groundY = -viewport.height * 0.36; // the invisible floor, near the bottom of the screen

    for (let i = 0; i < count; i++) {
      const d = delay[i];
      const r0 = radius[i] * ws;
      tmp.q0.set(quat0[i * 4], quat0[i * 4 + 1], quat0[i * 4 + 2], quat0[i * 4 + 3]);
      tmp.ax.set(axis[i * 3], axis[i * 3 + 1], axis[i * 3 + 2]);
      tmp.s.set(r0, r0, r0);

      // `d` is the moment it passes the mouth. Before that it slides there from its place in the
      // bottle, accelerating evenly so it leaves at EXIT_SPEED - and the fall carries on from exactly
      // that point, speed and direction, so there's no jump or hesitation at the mouth.
      const dx = mouthJit[i * 3] - start[i * 3], dy = mouthJit[i * 3 + 1] - start[i * 3 + 1], dz = mouthJit[i * 3 + 2] - start[i * 3 + 2];
      const dist = Math.hypot(dx, dy, dz);
      const slide = (2 * dist) / EXIT_SPEED / SIM_SECONDS_PER_PROGRESS; // progress it takes to reach the mouth
      tmp.dir.set(dx / dist, dy / dist, dz / dist).transformDirection(tmp.pour);
      tmp.mj.set(mouthJit[i * 3], mouthJit[i * 3 + 1] - CENTER_Y, mouthJit[i * 3 + 2]).applyMatrix4(tmp.pour); // tilt space is centred on CENTER_Y

      if (p < d) {
        // inside the bottle (bottle space)
        const k = clamp01((p - (d - slide)) / slide) ** 2;
        tmp.p.set(start[i * 3] + dx * k, start[i * 3 + 1] + dy * k - CENTER_Y, start[i * 3 + 2] + dz * k).applyMatrix4(mw);
        tmp.q.copy(tmp.q0);
      } else {
        // Out of the mouth: plain projectile motion (exact for any scroll position, so scrubbing
        // back and forth is consistent). It falls, strikes the floor once and rebounds on a
        // ballistic arc that carries it into the lens, tumbling the whole way.
        const t = (p - d) * SIM_SECONDS_PER_PROGRESS; // seconds since leaving the mouth
        const x0 = tmp.mj.x, y0 = tmp.mj.y, z0 = tmp.mj.z;
        const vx = (tmp.dir.x * EXIT_SPEED + spread[i * 3]) * ws;
        const vy = (tmp.dir.y * EXIT_SPEED + spread[i * 3 + 1]) * ws;
        const vz = (tmp.dir.z * EXIT_SPEED + spread[i * 3 + 2]) * ws;
        const floor = groundY + r0 * 0.45; // edge-on contact: half the tablet's thickness above the floor
        const hit = (vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, y0 - floor))) / g; // time until it strikes the floor

        if (t < hit) {
          tmp.p.set(x0 + vx * t, y0 + vy * t - 0.5 * g * t * t, z0 + vz * t);
          tmp.spin.setFromAxisAngle(tmp.ax, omega[i] * t);
          tmp.q.multiplyQuaternions(tmp.spin, tmp.q0);
        } else {
          // the rebound: launch velocity chosen so the arc ends at this tablet's spot in front of
          // the camera after `flight` seconds - a real parabola, just aimed
          const ix = x0 + vx * hit, iz = z0 + vz * hit;
          const T = flight[i];
          const u = Math.min(t - hit, T);
          const tx = targets[i * 3], ty = targets[i * 3 + 1], tz = targets[i * 3 + 2];
          const bx = (tx - ix) / T;
          const by = (ty - floor) / T + 0.5 * g * T;
          const bz = (tz - iz) / T;
          // past its spot it carries straight on at the speed it arrived with - no slowing or
          // stopping before the screen fades to tablet colour
          const after = Math.max(0, t - hit - T);
          tmp.p.set(ix + bx * (u + after), floor + by * u - 0.5 * g * u * u + (by - g * T) * after, iz + bz * (u + after));
          // the impact kicks it into a new, faster tumble
          tmp.spin.setFromAxisAngle(tmp.ax, omega[i] * hit);
          tmp.q.multiplyQuaternions(tmp.spin, tmp.q0);
          tmp.ax.set(axis2[i * 3], axis2[i * 3 + 1], axis2[i * 3 + 2]);
          tmp.spin.setFromAxisAngle(tmp.ax, omega[i] * 1.6 * (t - hit));
          tmp.q.premultiply(tmp.spin);
        }
      }

      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      tablets.current.setMatrixAt(i, tmp.m);
    }
    tablets.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <mesh position={[0, 0, -8]} scale={[60, 60, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={backdrop} toneMapped={false} />
      </mesh>

      <group ref={rig} scale={baseScale}>
        <group ref={tilt}>
          <group
            position={[0, -CENTER_Y, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPillClick();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "var(--cursor-hand, pointer)";
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = "";
            }}
          >
            <mesh geometry={bottleGeo} castShadow receiveShadow>
              {/* HDPE: soft satin white with a little sheen; lower env light so the key light models the form */}
              <meshPhysicalMaterial color="#f1eee6" roughness={0.42} clearcoat={0.3} clearcoatRoughness={0.35} sheen={0.5} sheenRoughness={0.5} sheenColor="#ffffff" envMapIntensity={0.75} side={THREE.DoubleSide} />
            </mesh>
            {/* the Mirasha wrap; thetaStart puts the middle of the canvas on the front (+Z) */}
            <mesh position={[0, (LABEL_Y0 + LABEL_Y1) / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[R + 0.006, R + 0.006, LABEL_Y1 - LABEL_Y0, LOW_POWER ? 96 : 160, 1, true, -Math.PI, Math.PI * 2]} />
              <meshPhysicalMaterial map={label} roughness={0.34} clearcoat={0.7} clearcoatRoughness={0.12} envMapIntensity={0.8} />
            </mesh>
            <group ref={cap} position={[0, CAP_Y, 0]}>
              <mesh geometry={capGeo} castShadow receiveShadow>
                <meshPhysicalMaterial color={BRAND_GREEN} roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.25} envMapIntensity={1.2} side={THREE.DoubleSide} />
              </mesh>
              {/* gold ring at the base of the cap */}
              <mesh position={[0, 0.03, 0]} castShadow>
                <cylinderGeometry args={[CAP_R + 0.02, CAP_R + 0.02, 0.05, 96, 1, true]} />
                <meshPhysicalMaterial color={GOLD} metalness={0.9} roughness={0.25} envMapIntensity={1.4} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* floor under the standing bottle: a soft pool of light and the bottle's shadow; both fade as it lifts */}
      <group position={[baseX, floorY, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={baseScale * 7} position={[0.3 * baseScale, 0, -0.3 * baseScale]}>
          <planeGeometry />
          <meshBasicMaterial ref={floorGlow} map={glowTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={baseScale * 9} position={[0, 0.002, 0]} receiveShadow>
          <planeGeometry />
          <shadowMaterial ref={floorShadow} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>

      {/* tablets live in world space so they can leave the bottle and fly at the camera */}
      <instancedMesh ref={tablets} args={[tabletGeo, undefined, data.count]} frustumCulled={false}>
        <instancedBufferAttribute attach="instanceColor" args={[data.colors, 3]} />
        {/* matte pressed powder: no clearcoat, grainy bump from the same herb texture */}
        <meshStandardMaterial map={tabletTex} bumpMap={tabletTex} bumpScale={1.5} roughness={0.92} metalness={0} envMapIntensity={0.7} />
      </instancedMesh>
    </>
  );
}

/**
 * Soft studio lighting for reflections: a large top softbox, two strip lights, a faint
 * front fill and a back rim, baked once into a PMREM environment map. Replaces drei's
 * <Environment>, which pulled HDR/EXR loaders into the bundle that this scene never uses.
 */
function bakeStudio(gl: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  const plane = new THREE.PlaneGeometry();
  const circle = new THREE.CircleGeometry(0.5, 32);
  const add = (geo: THREE.BufferGeometry, intensity: number, color: string, pos: [number, number, number], scale: [number, number, number]) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.lookAt(0, 0, 0); // every light faces the bottle
    env.add(mesh);
  };
  add(plane, 2.2, "#ffffff", [0, 6, 1], [14, 5, 1]);
  add(plane, 3, "#ffffff", [-7, 0.5, 2], [10, 1.4, 1]);
  add(plane, 1.6, "#dfe8ff", [7, 0, 1], [10, 0.8, 1]);
  add(circle, 0.5, "#ffffff", [0, 0, 9], [6, 6, 1]);
  add(plane, 1.2, "#ffffff", [0, -1, -8], [16, 2, 1]);

  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(env, 0, 0.1, 100);
  pmrem.dispose();
  env.traverse((o) => (o as THREE.Mesh).material && ((o as THREE.Mesh).material as THREE.Material).dispose());
  plane.dispose();
  circle.dispose();
  return target;
}

function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => bakeStudio(gl), [gl]);
  useEffect(() => () => target.dispose(), [target]);
  return <primitive object={target.texture} attach="environment" />;
}

/**
 * Compiles every shader in the scene asynchronously (KHR_parallel_shader_compile) before
 * the first frame is drawn, instead of one long blocking compile inside the first render.
 * Rendered last so the environment map is already in place.
 */
function Precompile({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch(() => {}) // fall back to compiling on first render
      .then(() => !cancelled && onDone());
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onDone]);
  return null;
}

/** Calls `onReady` once a few frames have rendered (environment baked, first frames on screen). */
function FirstFrames({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) onReady();
  });
  return null;
}

export default function PillScene({ progress, onPillClick, active, onReady }: SceneProps & { active: boolean; onReady: () => void }) {
  const [compiled, setCompiled] = useState(false);
  const [framesDrawn, setFramesDrawn] = useState(false);
  const markCompiled = useMemo(() => () => setCompiled(true), []);
  const markFramesDrawn = useMemo(() => () => setFramesDrawn(true), []);

  // Startup, all behind the loading screen: compile shaders → draw the first frames → mount and
  // warm the depth-of-field pass → tell the loader we're ready (onReady). Phones skip the
  // depth of field: its warm-up costs seconds on a mobile CPU for a subtle effect on a small screen.
  return (
    <Canvas
      frameloop={active && compiled ? "always" : "never"}
      dpr={LOW_POWER ? [1, 1.5] : [1, 1.75]}
      shadows
      camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 60 }}
      gl={{ antialias: !LOW_POWER, powerPreference: "high-performance", toneMappingExposure: 1.05 }}
    >
      {/* key (casts the shadows), cool fill, and a warm rim from behind to lift the edges off the black */}
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[-4, 7, 6]}
        intensity={2.6}
        castShadow
        shadow-mapSize={LOW_POWER ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      <directionalLight position={[6, 1, 4]} intensity={0.45} color="#cfdcff" />
      <directionalLight position={[3, 4, -6]} intensity={2.2} color="#ffe2b8" />
      <Bottle progress={progress} onPillClick={onPillClick} />
      <StudioEnvironment />
      {framesDrawn && !LOW_POWER && (
        <Suspense fallback={null}>
          <PelletFocus progress={progress} onWarm={onReady} />
        </Suspense>
      )}
      <FirstFrames onReady={LOW_POWER ? onReady : markFramesDrawn} />
      <Precompile onDone={markCompiled} />
    </Canvas>
  );
}
