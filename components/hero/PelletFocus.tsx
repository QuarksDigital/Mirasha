"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { DepthOfField, EffectComposer } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import * as THREE from "three";

// Loaded lazily by PillScene (desktop only) so the post-processing library stays out of the main bundle.
// Keep these in sync with the timeline in PillScene.
const CAMERA_Z = 11;
const BLUR_START = 0.32; // bottle starts to defocus as the first tablets get close
const BLUR_FULL = 0.4;
const WARM_FRAMES = 2; // render enabled briefly on mount so every shader variant compiles up front

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Depth of field: as the pellets reach the lens, focus pulls from the capsule (~CAMERA_Z away)
 * onto the near pellets, so the capsule behind softens. The composer is disabled outside the
 * burst, so the idle capsule renders without the extra pass.
 *
 * The first enabled frames compile the DOF shaders plus render-target variants of every scene
 * material (a few hundred ms). That happens behind the loading screen: `onWarm` fires once
 * they're done, and the loader waits for it, so nothing stalls during the reveal or the burst.
 */
export default function PelletFocus({ progress, onWarm }: { progress: React.RefObject<number>; onWarm: () => void }) {
  const dof = useRef<DepthOfFieldEffect>(null);
  const frames = useRef(0);
  const warmed = useRef(false);
  const [on, setOn] = useState(true);
  useFrame(() => {
    const p = progress.current ?? 0;
    const k = smoothstep(BLUR_START, BLUR_FULL, p);
    const warming = frames.current++ < WARM_FRAMES;
    if (!warming && !warmed.current) {
      warmed.current = true;
      onWarm();
    }
    const want = k > 0 || warming;
    if (want !== on) setOn(want);
    if (!dof.current) return;
    dof.current.cocMaterial.focusDistance = THREE.MathUtils.lerp(CAMERA_Z, 1.6, k);
    dof.current.cocMaterial.focusRange = THREE.MathUtils.lerp(6, 1.8, k);
    dof.current.bokehScale = k * 7;
  });
  return (
    <EffectComposer enabled={on} multisampling={4}>
      <DepthOfField ref={dof} focusDistance={CAMERA_Z} focusRange={6} bokehScale={0} resolutionScale={0.5} />
    </EffectComposer>
  );
}
