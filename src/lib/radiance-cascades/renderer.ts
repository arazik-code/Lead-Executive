import { init, surface, type Gpu, type Surface } from "vgpu";
import {
  createScene,
  destroyScene,
  prepareScene,
  presentScene,
  renderLighting,
  scaledSize,
  type AgentRadianceAnimation,
  type AgentRadianceScene,
} from "./simulation";

const ANIMATION: AgentRadianceAnimation = "center-out";
const OUTPUT_SCALE = Math.min(window.devicePixelRatio || 1, 1.35);
const LOW_POWER = (navigator.hardwareConcurrency || 8) <= 4;
const MAX_SCENE_EDGE = window.innerWidth < 700 || LOW_POWER ? 320 : 480;
const MAX_OUTPUT_EDGE = 1280;
const CASCADE_FPS = window.innerWidth < 700 || LOW_POWER ? 15 : 21;

interface RendererOptions {
  readonly canvas: HTMLCanvasElement;
  readonly onReady?: () => void;
  readonly onUnavailable: (error: unknown) => void;
}

/** A small, self-contained compositor for the landing hero's radiance field. */
export function createRenderer({ canvas, onReady, onUnavailable }: RendererOptions) {
  let disposed = false;
  let gpu: Gpu | undefined;
  let canvasSurface: Surface | undefined;
  let scene: AgentRadianceScene | undefined;
  let scenePrepared = false;
  let sceneGeneration = 0;
  let inViewport = true;
  let intersectionObserver: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let unsubscribeResize: (() => void) | undefined;
  let animationFrame = 0;
  let resizeFrame = 0;
  let pendingSize: { readonly width: number; readonly height: number } | undefined;
  let animationTime = 1.15;
  let lastTimestamp = 0;
  let lastChainTimestamp = -Infinity;
  let dirty = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    let firstError: unknown;
    for (const cleanup of [
      () => { if (scene) { destroyScene(scene); scene = undefined; } },
      () => intersectionObserver?.disconnect(),
      () => resizeObserver?.disconnect(),
      unsubscribeResize,
      () => gpu?.dispose(),
    ]) {
      try {
        cleanup?.();
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) throw firstError;
  };

  const fail = (error: unknown) => {
    if (disposed) return;
    try { dispose(); } catch { /* Preserve the original GPU error. */ }
    onUnavailable(error);
  };

  const rebuildScene = (reportFailure = true) => {
    if (disposed || !gpu || !canvasSurface) return;
    const size = scaledSize(canvasSurface.size[0], canvasSurface.size[1], 1, MAX_SCENE_EDGE);
    if (scene?.size[0] === size[0] && scene.size[1] === size[1] && scene.directionBase === 2) return;

    const next = createScene(gpu, size, 2);
    const previous = scene;
    scene = next;
    scenePrepared = false;
    dirty = true;
    const generation = ++sceneGeneration;
    if (previous) destroyScene(previous);
    const preparation = prepareScene(next, canvasSurface.format).then(() => {
      if (disposed || scene !== next || generation !== sceneGeneration) return;
      scenePrepared = true;
      dirty = true;
    });
    if (reportFailure) void preparation.catch(fail);
    return preparation;
  };

  const measure = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (disposed || width <= 0 || height <= 0) return;
    pendingSize = { width, height };
    if (!resizeFrame) resizeFrame = requestAnimationFrame(applyResize);
  };

  const applyResize = () => {
    resizeFrame = 0;
    const size = pendingSize;
    pendingSize = undefined;
    if (disposed || !size || !canvasSurface) return;
    try {
      canvasSurface.resize(scaledSize(size.width, size.height, OUTPUT_SCALE, MAX_OUTPUT_EDGE));
      rebuildScene();
    } catch (error) {
      fail(error);
    }
  };

  const onSurfaceResize = () => {
    try { rebuildScene(); } catch (error) { fail(error); }
  };

  const tick = (timestamp: number) => {
    animationFrame = 0;
    if (disposed) return;
    if (inViewport && !document.hidden && scenePrepared && scene && canvasSurface) {
      const delta = lastTimestamp > 0 ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0;
      if (!reducedMotion) animationTime += delta;
      if (dirty || (!reducedMotion && timestamp - lastChainTimestamp >= 1000 / CASCADE_FPS)) {
        try {
          renderLighting(scene, animationTime, "final", ANIMATION);
          dirty = false;
          lastChainTimestamp = timestamp;
        } catch (error) {
          fail(error);
          return;
        }
      }
      try { presentScene(scene, canvasSurface, "final"); } catch (error) { fail(error); return; }
    }
    lastTimestamp = timestamp;
    animationFrame = requestAnimationFrame(tick);
  };

  const initialize = async () => {
    if (!("gpu" in navigator)) throw new Error("WebGPU is unavailable in this browser.");
    if (disposed) return;
    const nextGpu = await init();
    if (disposed) { nextGpu.dispose(); return; }
    gpu = nextGpu;
    canvasSurface = surface(gpu, canvas, { autoResize: false, dpr: 1 });
    await rebuildScene(false);
    if (disposed) return;
    unsubscribeResize = canvasSurface.onResize(onSurfaceResize);
    resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    resizeObserver?.observe(canvas);
    intersectionObserver = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting);
      if (inViewport) dirty = true;
    }, { rootMargin: "120px" });
    intersectionObserver?.observe(canvas);
    measure();
    animationFrame = requestAnimationFrame(tick);
    onReady?.();
  };

  const ready = initialize().catch(fail);
  return { ready, dispose };
}
