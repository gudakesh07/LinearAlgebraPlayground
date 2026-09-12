import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mag, vec } from "@/lib/math";
import {
  COLOR_MAP,
  COLORS,
  type ArrowSpec,
  type SceneModel,
  type Vec3,
  type VecColor,
} from "@/lib/types";

interface Canvas3DProps {
  model: SceneModel;
  azimuth: number;
  onAzimuthChange: (deg: number) => void;
}

const LABEL_COLOR: Record<VecColor | "axis", string> = {
  a: "#f0f0f0",
  b: "#f9d4d4",
  result: "#f5c96a",
  dim: "#f0f0f0",
  axis: "#888888",
};

const LABEL_OFFSET_PX = 12;

interface OverlayLabel {
  id: string;
  text: string;
  color: string;
  world: Vec3;
  from: Vec3;
}

function toVec3(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}

function wrapDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function thetaToDeg(theta: number): number {
  return wrapDeg((theta * 180) / Math.PI);
}

function makeArrow(spec: ArrowSpec): THREE.Group {
  const group = new THREE.Group();
  const from = spec.from ?? vec();
  const length = mag(spec.vec);
  const color = new THREE.Color(COLOR_MAP[spec.color]);
  group.position.copy(toVec3(from));

  if (length < 1e-6) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color }),
    );
    group.add(dot);
    return group;
  }

  const dir = toVec3(spec.vec).normalize();
  const headLen = Math.min(0.32, length * 0.22);
  const headWidth = Math.min(0.16, length * 0.1);
  const helper = new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0, 0, 0),
    length,
    color,
    headLen,
    headWidth,
  );
  if (spec.dashed) {
    const line = helper.line as THREE.Line;
    const mat = line.material;
    if (!Array.isArray(mat) && "color" in mat) {
      line.material = new THREE.LineDashedMaterial({
        color,
        dashSize: 0.12,
        gapSize: 0.08,
        linewidth: 2,
      });
      line.computeLineDistances();
    }
  }
  group.add(helper);
  return group;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = (child as THREE.Mesh).material;
    if (!mat) return;
    const mats = Array.isArray(mat) ? mat : [mat];
    for (const m of mats) {
      if ("map" in m && m.map) (m.map as THREE.Texture).dispose();
      m.dispose();
    }
  });
}

function fitRadius(model: SceneModel): number {
  let max = 3;
  const consider = (v: Vec3) => {
    max = Math.max(max, mag(v));
  };
  for (const a of model.arrows) {
    const from = a.from ?? vec();
    consider(from);
    consider({ x: from.x + a.vec.x, y: from.y + a.vec.y, z: from.z + a.vec.z });
  }
  for (const s of model.segments) {
    consider(s.from);
    consider(s.to);
  }
  return Math.max(6, max * 2.6);
}

function axisSizeFor(model: SceneModel): number {
  return Math.max(3, fitRadius(model) * 0.28);
}

function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObject(child);
  }
}

function syncScene(
  content: THREE.Group,
  axes: THREE.Group,
  model: SceneModel,
) {
  clearGroup(content);
  clearGroup(axes);

  axes.add(buildAxes(axisSizeFor(model)));

  for (const a of model.arrows) {
    content.add(makeArrow(a));
  }

  for (const seg of model.segments) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      toVec3(seg.from),
      toVec3(seg.to),
    ]);
    const mat = seg.dashed
      ? new THREE.LineDashedMaterial({
          color: COLOR_MAP[seg.color],
          dashSize: 0.12,
          gapSize: 0.08,
        })
      : new THREE.LineBasicMaterial({ color: COLOR_MAP[seg.color] });
    const line = new THREE.Line(geo, mat);
    if (seg.dashed) line.computeLineDistances();
    content.add(line);
  }

  for (const poly of model.polygons) {
    if (poly.points.length < 3) continue;
    const verts: number[] = [];
    const p0 = poly.points[0];
    for (let i = 1; i < poly.points.length - 1; i++) {
      const p1 = poly.points[i];
      const p2 = poly.points[i + 1];
      verts.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: COLOR_MAP[poly.color],
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    content.add(mesh);
  }
}

function buildAxes(size: number): THREE.Group {
  const g = new THREE.Group();
  const color = new THREE.Color(0x666666);
  const addAxis = (to: THREE.Vector3) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      to.clone().multiplyScalar(-1),
      to,
    ]);
    g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
  };
  addAxis(new THREE.Vector3(size, 0, 0));
  addAxis(new THREE.Vector3(0, size, 0));
  addAxis(new THREE.Vector3(0, 0, size));
  g.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshBasicMaterial({ color: COLORS.text }),
    ),
  );
  return g;
}

function collectOverlayLabels(model: SceneModel): OverlayLabel[] {
  const labels: OverlayLabel[] = [];
  const origin = vec();

  for (const arrow of model.arrows) {
    // Tip-to-tail copies share a tip with the resultant — skip their labels.
    if (arrow.from) continue;
    const from = origin;
    const tip = {
      x: from.x + arrow.vec.x,
      y: from.y + arrow.vec.y,
      z: from.z + arrow.vec.z,
    };
    labels.push({
      id: `arrow-${arrow.id}`,
      text: arrow.label,
      color: LABEL_COLOR[arrow.color],
      world: tip,
      from,
    });
  }

  const axis = axisSizeFor(model);
  labels.push(
    {
      id: "axis-x",
      text: "x",
      color: LABEL_COLOR.axis,
      world: { x: axis, y: 0, z: 0 },
      from: origin,
    },
    {
      id: "axis-y",
      text: "y",
      color: LABEL_COLOR.axis,
      world: { x: 0, y: axis, z: 0 },
      from: origin,
    },
    {
      id: "axis-z",
      text: "z",
      color: LABEL_COLOR.axis,
      world: { x: 0, y: 0, z: axis },
      from: origin,
    },
  );

  return labels;
}

function projectToScreen(
  world: Vec3,
  camera: THREE.Camera,
  width: number,
  height: number,
  scratch: THREE.Vector3,
): { x: number; y: number; visible: boolean } {
  scratch.set(world.x, world.y, world.z).project(camera);
  const visible =
    scratch.z >= -1 &&
    scratch.z <= 1 &&
    Number.isFinite(scratch.x) &&
    Number.isFinite(scratch.y);
  return {
    x: (scratch.x * 0.5 + 0.5) * width,
    y: (-scratch.y * 0.5 + 0.5) * height,
    visible,
  };
}

export function Canvas3D({ model, azimuth, onAzimuthChange }: Canvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const labelNodes = useRef<Map<string, HTMLDivElement>>(new Map());
  const modelRef = useRef(model);
  const azimuthRef = useRef(azimuth);
  const onAzimuthRef = useRef(onAzimuthChange);
  const draggingRef = useRef(false);
  const slidingRef = useRef(false);
  const sceneBits = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    content: THREE.Group;
    axes: THREE.Group;
  } | null>(null);

  const overlayLabels = useMemo(() => collectOverlayLabels(model), [model]);
  const overlayLabelsRef = useRef(overlayLabels);

  modelRef.current = model;
  azimuthRef.current = azimuth;
  onAzimuthRef.current = onAzimuthChange;
  overlayLabelsRef.current = overlayLabels;

  useEffect(() => {
    const container = containerRef.current;
    const mount = mountRef.current;
    if (!container || !mount) return;

    let cleanup = () => {};

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(COLORS.bg);

      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = "none";
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = 2;
      controls.maxDistance = 80;
      controls.target.set(0, 0, 0);

      const content = new THREE.Group();
      const axes = new THREE.Group();
      scene.add(content);
      scene.add(axes);

      const grid = new THREE.GridHelper(16, 16, 0x333333, 0x1a1a1a);
      const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
      for (const m of gridMats) {
        m.transparent = true;
        m.opacity = 0.45;
      }
      scene.add(grid);

      const radius = fitRadius(modelRef.current);
      const phi = Math.PI / 3;
      const theta = (azimuthRef.current * Math.PI) / 180;
      camera.position.setFromSpherical(new THREE.Spherical(radius, phi, theta));
      camera.lookAt(0, 0, 0);
      controls.update();

      sceneBits.current = { scene, camera, renderer, controls, content, axes };
      syncScene(content, axes, modelRef.current);

      const setSize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w < 2 || h < 2) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      setSize();
      const ro = new ResizeObserver(setSize);
      ro.observe(container);

      const onStart = () => {
        draggingRef.current = true;
      };
      const onEnd = () => {
        draggingRef.current = false;
      };
      const onChange = () => {
        if (slidingRef.current) return;
        onAzimuthRef.current(thetaToDeg(controls.getAzimuthalAngle()));
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        setRenderError("3D view paused because the browser lost its WebGL context.");
      };
      controls.addEventListener("start", onStart);
      controls.addEventListener("end", onEnd);
      controls.addEventListener("change", onChange);
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);

      const scratchTip = new THREE.Vector3();
      const scratchFrom = new THREE.Vector3();

      const positionLabels = () => {
        const overlay = overlayRef.current;
        if (!overlay) return;
        const w = overlay.clientWidth;
        const h = overlay.clientHeight;
        if (w < 2 || h < 2) return;

        for (const label of overlayLabelsRef.current) {
          const el = labelNodes.current.get(label.id);
          if (!el) continue;

          const tip = projectToScreen(label.world, camera, w, h, scratchTip);
          const root = projectToScreen(label.from, camera, w, h, scratchFrom);
          let dx = tip.x - root.x;
          let dy = tip.y - root.y;
          const len = Math.hypot(dx, dy);
          if (len < 1) {
            dx = 0;
            dy = -1;
          } else {
            dx /= len;
            dy /= len;
          }

          const x = Math.min(w - 8, Math.max(8, tip.x + dx * LABEL_OFFSET_PX));
          const y = Math.min(h - 8, Math.max(8, tip.y + dy * LABEL_OFFSET_PX));
          const onScreen =
            tip.visible &&
            Number.isFinite(tip.x) &&
            Number.isFinite(tip.y) &&
            tip.x > -40 &&
            tip.x < w + 40 &&
            tip.y > -40 &&
            tip.y < h + 40;

          if (!onScreen) {
            el.style.opacity = "0";
            el.style.visibility = "hidden";
            el.style.transform = "translate3d(0px, 0px, 0)";
            continue;
          }

          el.style.visibility = "visible";
          el.style.opacity = "1";
          el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        }
      };

      let raf = 0;
      const loop = () => {
        controls.update();
        renderer.render(scene, camera);
        positionLabels();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      controls.removeEventListener("change", onChange);
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      sceneBits.current = null;
      };
    } catch (error) {
      console.error("Unable to start 3D view", error);
      setRenderError(
        "3D view could not start because WebGL is unavailable in this browser.",
      );
      sceneBits.current = null;
    }

    return () => cleanup();
  }, []);

  useEffect(() => {
    const bits = sceneBits.current;
    if (!bits) return;
    syncScene(bits.content, bits.axes, model);
  }, [model]);

  useEffect(() => {
    const bits = sceneBits.current;
    if (!bits || draggingRef.current) return;
    const { camera, controls } = bits;
    const current = thetaToDeg(controls.getAzimuthalAngle());
    if (Math.abs(current - wrapDeg(azimuth)) < 0.4) return;
    slidingRef.current = true;
    const offset = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    sph.theta = (azimuth * Math.PI) / 180;
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    camera.lookAt(controls.target);
    controls.update();
    slidingRef.current = false;
  }, [azimuth]);

  if (renderError) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-sm leading-relaxed text-[#888]"
        aria-label="3D view unavailable"
      >
        <p>
          <span className="block text-[#f9d4d4]">3D view unavailable.</span>
          {renderError}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      aria-label="3D vector graph, drag to orbit"
    >
      <div ref={mountRef} className="absolute inset-0 touch-none" />
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 overflow-clip"
        aria-hidden="true"
      >
        {overlayLabels.map((label) => (
          <div
            key={label.id}
            ref={(el) => {
              if (el) labelNodes.current.set(label.id, el);
              else labelNodes.current.delete(label.id);
            }}
            className="absolute top-0 left-0 font-mono text-[13px] font-semibold whitespace-nowrap"
            style={{
              color: label.color,
              background: "rgba(0, 0, 0, 0.75)",
              padding: "2px 8px",
              borderRadius: 4,
              willChange: "transform",
              opacity: 0,
              transform: "translate3d(-9999px, -9999px, 0)",
            }}
          >
            {label.text}
          </div>
        ))}
      </div>
    </div>
  );
}
