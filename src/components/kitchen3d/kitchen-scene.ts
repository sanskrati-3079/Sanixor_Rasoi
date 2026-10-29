import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { HotspotId } from "./kitchen-secrets";

export type { HotspotId };

type SceneOptions = {
  canvas: HTMLCanvasElement;
  /** Floating HTML buttons that track hotspots on screen. */
  pins: Partial<Record<HotspotId, HTMLElement | null>>;
  /** Drag-to-orbit (off on touch screens so the page can still scroll). */
  orbit: boolean;
  onHotspot: (id: HotspotId) => void;
  onHoverChange: (id: HotspotId | null) => void;
  /** Called once every piece of the kitchen has settled into place. */
  onAssembled: () => void;
};

export type KitchenSceneApi = {
  /** Plays the effect for a hotspot (cooker whistle, day/night…). */
  trigger: (id: HotspotId) => void;
  dispose: () => void;
};

/** Reads a design token (e.g. "denim") from the page's CSS variables. */
function token(name: string): THREE.Color {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-" + name)
    .trim();
  return new THREE.Color(value || "gray");
}

function material(
  name: string,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({
    color: token(name),
    roughness: 0.65,
    metalness: 0,
    ...options,
  });
}

const steel = (name = "steel") =>
  material(name, { metalness: 0.75, roughness: 0.32 });

/** Small canvas-drawn textures so no image files are needed. */
function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat: [number, number],
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 4;
  return texture;
}

const css = (name: string) =>
  "#" + token(name).getHexString(THREE.SRGBColorSpace);

const easeOutBack = (x: number) => {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Intro = "floor" | "wall" | "drop";

export function createKitchenScene(options: SceneOptions): KitchenSceneApi {
  const { canvas } = options;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3(-0.3, 0.95, -0.4);
  /** Everything except the main lights, so the room can lean toward the cursor. */
  const room = new THREE.Group();
  scene.add(room);

  // ---------- helpers ----------
  const shadow = <T extends THREE.Object3D>(object: T) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return object;
  };

  function box(
    size: [number, number, number],
    mat: THREE.Material,
    position: [number, number, number],
    parent: THREE.Object3D = room,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.position.set(...position);
    parent.add(shadow(mesh));
    return mesh;
  }

  function cylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    mat: THREE.Material,
    position: [number, number, number],
    parent: THREE.Object3D = room,
    openEnded = false,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        40,
        1,
        openEnded,
      ),
      mat,
    );
    mesh.position.set(...position);
    parent.add(shadow(mesh));
    return mesh;
  }

  function sphere(
    radius: number,
    mat: THREE.Material,
    position: [number, number, number],
    parent: THREE.Object3D = room,
    scale: [number, number, number] = [1, 1, 1],
  ) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), mat);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(shadow(mesh));
    return mesh;
  }

  /** A clickable group; its meshes glow together on hover. */
  function hotspot(id: HotspotId) {
    const group = new THREE.Group();
    group.userData.hotspot = id;
    room.add(group);
    return group;
  }

  const intro = <T extends THREE.Object3D>(object: T, kind: Intro) => {
    object.userData.intro = kind;
    return object;
  };

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(
    token("surface"),
    token("wood-light"),
    1.1,
  );
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(4, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 4;
  scene.add(sun);
  const windowLight = new THREE.PointLight(token("sky"), 3, 6);
  windowLight.position.set(-2.4, 1.9, -1.2);
  room.add(windowLight);
  // Warm ceiling light that fades in for night mode
  const lamp = new THREE.PointLight(token("turmeric"), 0, 9, 1.4);
  lamp.position.set(-0.4, 2.9, -0.6);
  room.add(lamp);

  // ---------- room shell ----------
  const planks = canvasTexture(
    512,
    (ctx, size) => {
      ctx.fillStyle = css("wood-light");
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = css("wood");
      ctx.lineWidth = 4;
      for (let i = 0; i <= 8; i += 1) {
        const y = (i * size) / 8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
        const x = ((i * 197) % size) + 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size / 8);
        ctx.stroke();
      }
    },
    [2, 2],
  );
  const tiles = canvasTexture(
    256,
    (ctx, size) => {
      ctx.fillStyle = css("surface");
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = css("line");
      ctx.lineWidth = 3;
      const rows = 8;
      for (let r = 0; r < rows; r += 1) {
        const y = (r * size) / rows;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
        for (let c = 0; c < 4; c += 1) {
          const x = (c * size) / 4 + (r % 2 ? size / 8 : 0);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + size / rows);
          ctx.stroke();
        }
      }
    },
    [6, 3],
  );

  intro(
    box([6.3, 0.25, 6.3], material("wood-dark"), [-0.15, -0.125, -0.15]),
    "floor",
  );
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6.3, 6.3),
    material("wood-light", { map: planks, roughness: 0.8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-0.15, 0.001, -0.15);
  floor.receiveShadow = true;
  room.add(intro(floor, "floor"));

  intro(
    box(
      [6.3, 3.2, 0.15],
      material("surface", { map: tiles }),
      [-0.15, 1.6, -3.225],
    ),
    "wall",
  );
  intro(
    box(
      [0.15, 3.2, 6.15],
      material("wall-shade", { map: tiles }),
      [-3.225, 1.6, -0.075],
    ),
    "wall",
  );
  intro(
    box([6.3, 0.06, 0.15], material("steel-light"), [-0.15, 3.23, -3.225]),
    "wall",
  );
  intro(
    box([0.15, 0.06, 6.15], material("steel-light"), [-3.225, 3.23, -0.075]),
    "wall",
  );

  // ---------- counters ----------
  const cabinet = material("denim", { roughness: 0.55 });
  const cabinetEdge = material("denim-edge");
  const counterTop = material("surface", { roughness: 0.35 });
  const handle = steel("steel-light");

  box([3.9, 0.1, 0.58], cabinetEdge, [-0.4, 0.05, -2.7]);
  box([3.9, 0.78, 0.65], cabinet, [-0.4, 0.49, -2.675]);
  box([3.95, 0.06, 0.7], counterTop, [-0.4, 0.91, -2.65]);
  for (const x of [-1.7, -1.05, -0.4, 0.25, 0.9]) {
    box([0.012, 0.7, 0.01], cabinetEdge, [x, 0.49, -2.345]);
  }
  for (const x of [-2.02, -1.37, -0.72, -0.07, 0.58, 1.22]) {
    box([0.16, 0.022, 0.03], handle, [x, 0.79, -2.33]);
  }

  box([0.58, 0.1, 4.0], cabinetEdge, [-2.7, 0.05, -1.0]);
  box([0.65, 0.78, 4.0], cabinet, [-2.675, 0.49, -1.0]);
  box([0.7, 0.06, 4.05], counterTop, [-2.65, 0.91, -0.98]);
  for (const z of [-1.7, -1.05, -0.4, 0.25]) {
    box([0.01, 0.7, 0.012], cabinetEdge, [-2.345, 0.49, z]);
  }
  for (const z of [-2.0, -1.37, -0.72, -0.07, 0.6]) {
    box([0.03, 0.022, 0.16], handle, [-2.33, 0.79, z]);
  }

  // Sink and tap under the window
  box([0.5, 0.02, 0.8], steel("steel-light"), [-2.68, 0.95, -1.2]);
  box(
    [0.4, 0.01, 0.68],
    material("steel-dark", { metalness: 0.6, roughness: 0.4 }),
    [-2.68, 0.962, -1.2],
  );
  const tapMat = steel();
  cylinder(0.02, 0.02, 0.32, tapMat, [-2.95, 1.1, -1.2]);
  const spout = cylinder(0.016, 0.016, 0.2, tapMat, [-2.86, 1.26, -1.2]);
  spout.rotation.z = Math.PI / 2;
  cylinder(0.016, 0.016, 0.07, tapMat, [-2.77, 1.23, -1.2]);

  // ---------- window (secret: day / night) ----------
  const windowGroup = hotspot("window");
  const windowFrame = material("surface");
  const glass = new THREE.MeshBasicMaterial({ color: token("sky-deep") });
  const dayGlass = token("sky-deep");
  const nightGlass = token("denim-edge");
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), glass);
  pane.rotation.y = Math.PI / 2;
  pane.position.set(-3.14, 1.8, -1.2);
  windowGroup.add(pane);
  box([0.06, 0.06, 1.42], windowFrame, [-3.12, 2.27, -1.2], windowGroup);
  box([0.06, 0.06, 1.42], windowFrame, [-3.12, 1.33, -1.2], windowGroup);
  box([0.06, 1.0, 0.06], windowFrame, [-3.12, 1.8, -1.88], windowGroup);
  box([0.06, 1.0, 0.06], windowFrame, [-3.12, 1.8, -0.52], windowGroup);
  box([0.04, 0.9, 0.04], windowFrame, [-3.11, 1.8, -1.2], windowGroup);
  box([0.04, 0.04, 1.3], windowFrame, [-3.11, 1.8, -1.2], windowGroup);
  box([0.2, 0.04, 1.5], windowFrame, [-3.05, 1.3, -1.2], windowGroup);
  const moonMat = new THREE.MeshBasicMaterial({
    color: token("oak"),
    transparent: true,
    opacity: 0,
  });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), moonMat);
  moon.rotation.y = Math.PI / 2;
  moon.position.set(-3.13, 2.05, -1.55);
  windowGroup.add(moon);

  // Upper cabinets and chimney
  box([1.45, 0.8, 0.38], cabinet, [-1.625, 2.0, -2.96]);
  box([0.012, 0.74, 0.01], cabinetEdge, [-1.625, 2.0, -2.765]);
  box([0.022, 0.16, 0.03], handle, [-1.68, 1.72, -2.75]);
  box([0.022, 0.16, 0.03], handle, [-1.57, 1.72, -2.75]);
  const hoodMat = steel("steel-light");
  box([0.95, 0.16, 0.56], hoodMat, [0, 1.78, -2.88]);
  box([0.34, 1.35, 0.3], hoodMat, [0, 2.52, -3.0]);

  // ---------- fridge (hotspot: add your recipe) ----------
  const fridge = hotspot("add");
  box(
    [0.92, 2.05, 0.76],
    material("sky", { roughness: 0.35 }),
    [2.06, 1.025, -2.68],
    fridge,
  );
  box([0.92, 0.012, 0.01], cabinetEdge, [2.06, 1.4, -2.295], fridge);
  box([0.035, 0.42, 0.04], handle, [1.7, 1.68, -2.27], fridge);
  box([0.035, 0.6, 0.04], handle, [1.7, 0.95, -2.27], fridge);
  box([0.24, 0.3, 0.008], material("oak"), [2.2, 1.7, -2.296], fridge);
  sphere(0.025, material("chilli"), [2.2, 1.84, -2.29], fridge);

  // ---------- stove and kadhai (hotspot: cook) ----------
  const stove = hotspot("cook");
  box(
    [0.9, 0.05, 0.52],
    material("steel-dark", { metalness: 0.5, roughness: 0.35 }),
    [0, 0.965, -2.66],
    stove,
  );
  const burnerMat = material("ink", { roughness: 0.5 });
  const flames: THREE.Mesh[] = [];
  const additive = (name: string, opacity: number) =>
    new THREE.MeshBasicMaterial({
      color: token(name),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  const flameMat = additive("sky-deep", 0.9);
  const flameTipMat = additive("curry", 0.85);
  for (const x of [-0.22, 0.22]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.018, 12, 32),
      burnerMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.995, -2.66);
    stove.add(ring);
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.018, 0.07, 8),
        i % 3 === 0 ? flameTipMat : flameMat,
      );
      flame.position.set(
        x + Math.cos(angle) * 0.1,
        1.03,
        -2.66 + Math.sin(angle) * 0.1,
      );
      flame.userData.phase = Math.random() * 10;
      stove.add(flame);
      flames.push(flame);
    }
  }
  const flameLight = new THREE.PointLight(token("curry"), 1.4, 1.6);
  flameLight.position.set(0, 1.12, -2.5);
  stove.add(flameLight);

  const kadhai = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.18,
      32,
      16,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    material("steel-dark", {
      metalness: 0.4,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }),
  );
  kadhai.position.set(0.22, 1.18, -2.66);
  stove.add(shadow(kadhai));
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 8, 16),
      material("steel-dark"),
    );
    loop.position.set(0.22 + side * 0.2, 1.18, -2.66);
    loop.rotation.y = Math.PI / 2;
    stove.add(loop);
  }
  const curry = new THREE.Mesh(
    new THREE.CircleGeometry(0.155, 32),
    material("curry", { roughness: 0.3 }),
  );
  curry.rotation.x = -Math.PI / 2;
  curry.position.set(0.22, 1.13, -2.66);
  stove.add(curry);
  const bubbles: THREE.Mesh[] = [];
  const bubbleMat = material("turmeric", { roughness: 0.2 });
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.11;
    const bubble = sphere(
      0.014,
      bubbleMat,
      [
        0.22 + Math.cos(angle) * radius,
        1.135,
        -2.66 + Math.sin(angle) * radius,
      ],
      stove,
    );
    bubble.userData.phase = Math.random() * 10;
    bubbles.push(bubble);
  }
  sphere(0.02, material("leaf"), [0.18, 1.14, -2.62], stove);

  // ---------- pressure cooker (secret: whistle) ----------
  const cooker = hotspot("cooker");
  cylinder(0.13, 0.13, 0.22, steel("steel-light"), [-0.22, 1.1, -2.66], cooker);
  cylinder(0.138, 0.138, 0.03, steel(), [-0.22, 1.225, -2.66], cooker);
  box([0.32, 0.035, 0.055], material("ink"), [0.04, 1.23, -2.66], cooker);
  const whistle = new THREE.Group();
  whistle.position.set(-0.22, 1.275, -2.66);
  cylinder(0.02, 0.024, 0.07, material("ink"), [0, 0, 0], whistle);
  sphere(0.022, material("ink"), [0, 0.04, 0], whistle);
  cooker.add(whistle);

  // Steam from the whistle (appears once the kitchen is assembled)
  const steam = Array.from({ length: 22 }, (_, i) => {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 10),
      new THREE.MeshStandardMaterial({
        color: token("surface"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        roughness: 1,
      }),
    );
    puff.userData.phase = i / 22;
    puff.userData.skipIntro = true;
    room.add(puff);
    return puff;
  });

  // ---------- masala dabba + spice jars (secret: spice of the day) ----------
  const spices = hotspot("spices");
  cylinder(0.18, 0.18, 0.07, steel(), [-1.0, 0.975, -2.62], spices);
  cylinder(0.045, 0.045, 0.02, material("wood"), [-1.0, 1.015, -2.62], spices);
  const spiceColors = [
    "turmeric",
    "chilli",
    "curry",
    "leaf",
    "wood-dark",
    "accent-strong",
  ];
  spiceColors.forEach((name, i) => {
    const angle = (i / spiceColors.length) * Math.PI * 2;
    cylinder(
      0.045,
      0.045,
      0.02,
      material(name, { roughness: 0.9 }),
      [-1.0 + Math.cos(angle) * 0.11, 1.015, -2.62 + Math.sin(angle) * 0.11],
      spices,
    );
  });
  box([0.24, 0.04, 1.0], material("wood"), [-2.98, 1.82, -0.05]);
  for (const [name, z] of [
    ["turmeric", -0.42],
    ["chilli", -0.27],
    ["leaf", -0.12],
  ] as const) {
    cylinder(
      0.055,
      0.055,
      0.15,
      material(name, { roughness: 0.4 }),
      [-2.95, 1.915, z],
      spices,
    );
    cylinder(
      0.058,
      0.058,
      0.03,
      material("wood-dark"),
      [-2.95, 2.005, z],
      spices,
    );
  }

  // Chopping board with tomatoes and an onion
  box([0.48, 0.03, 0.32], material("wood"), [-1.75, 0.955, -2.6]);
  sphere(0.055, material("chilli", { roughness: 0.35 }), [-1.85, 1.02, -2.62]);
  sphere(0.05, material("chilli", { roughness: 0.35 }), [-1.74, 1.015, -2.55]);
  sphere(0.06, material("oak"), [-1.62, 1.025, -2.66], room, [1, 0.9, 1]);
  box([0.22, 0.008, 0.035], steel(), [-1.75, 0.975, -2.48]);

  // Steel dabbas in the corner
  cylinder(0.11, 0.11, 0.13, steel(), [-2.62, 1.005, -2.62]);
  cylinder(0.09, 0.09, 0.11, steel(), [-2.62, 1.125, -2.62]);

  // ---------- tulsi (secret: fact) ----------
  const tulsiSpot = hotspot("tulsi");
  cylinder(
    0.09,
    0.07,
    0.16,
    material("accent-strong"),
    [-2.65, 1.02, 0.6],
    tulsiSpot,
  );
  const tulsi = new THREE.Group();
  tulsi.position.set(-2.65, 1.1, 0.6);
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    sphere(
      0.05,
      material("leaf"),
      [Math.cos(angle) * 0.05, 0.1 + (i % 3) * 0.04, Math.sin(angle) * 0.05],
      tulsi,
      [0.8, 1.4, 0.8],
    );
  }
  tulsiSpot.add(tulsi);

  // ---------- cookbooks (hotspot: recipe book) ----------
  const books = hotspot("book");
  const bookSpecs: [string, number, number][] = [
    ["accent-strong", 0.1, 0.34],
    ["denim", 0.19, 0.3],
    ["turmeric", 0.27, 0.32],
  ];
  for (const [name, z, height] of bookSpecs) {
    box(
      [0.2, height, 0.075],
      material(name, { roughness: 0.6 }),
      [-2.96, 1.84 + height / 2, z],
      books,
    );
    box(
      [0.17, height - 0.03, 0.08],
      material("surface"),
      [-2.95, 1.84 + height / 2, z],
      books,
    );
  }
  books.children.at(-1)!.rotation.x = 0.18;
  books.children.at(-2)!.rotation.x = 0.18;

  // ---------- wall clock (secret: meal for the time of day) ----------
  const clock = hotspot("clock");
  clock.position.set(0.95, 2.35, -3.13);
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.03, 48),
    material("surface"),
  );
  face.rotation.x = Math.PI / 2;
  clock.add(face);
  clock.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.018, 12, 48),
      material("denim"),
    ),
  );
  const hand = (length: number, width: number) => {
    const pivot = new THREE.Group();
    pivot.position.z = 0.025;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, length, 0.01),
      material("ink"),
    );
    mesh.position.y = length / 2;
    pivot.add(mesh);
    clock.add(pivot);
    return pivot;
  };
  const hourHand = hand(0.1, 0.018);
  const minuteHand = hand(0.15, 0.012);

  // ---------- rug, basket (secret: quick-add vegetables), plant ----------
  const rugTexture = canvasTexture(
    256,
    (ctx, size) => {
      ctx.fillStyle = css("sky");
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = css("denim");
      for (const y of [0.12, 0.2, 0.8, 0.88])
        ctx.fillRect(0, y * size, size, size * 0.035);
      ctx.fillStyle = css("oak");
      ctx.fillRect(0, 0.45 * size, size, size * 0.1);
    },
    [1, 1],
  );
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.7),
    material("surface", { map: rugTexture, roughness: 0.95 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.5, 0.006, 0.5);
  rug.receiveShadow = true;
  room.add(rug);

  const basket = hotspot("basket");
  cylinder(
    0.34,
    0.27,
    0.3,
    material("wood", { roughness: 0.9, side: THREE.DoubleSide }),
    [0.9, 0.15, 0.8],
    basket,
    true,
  );
  cylinder(0.27, 0.27, 0.01, material("wood-dark"), [0.9, 0.01, 0.8], basket);
  const veg: [
    string,
    [number, number, number],
    number,
    [number, number, number],
  ][] = [
    ["wood-light", [0.8, 0.3, 0.72], 0.09, [1, 0.8, 1.2]],
    ["wood-light", [0.98, 0.31, 0.7], 0.085, [1.2, 0.8, 1]],
    ["oak", [0.86, 0.32, 0.9], 0.08, [1, 0.95, 1]],
    ["chilli", [1.02, 0.31, 0.88], 0.07, [1, 1, 1]],
    ["accent-strong", [0.92, 0.36, 0.8], 0.075, [1, 0.9, 1]],
  ];
  for (const [name, position, radius, scale] of veg) {
    sphere(
      radius,
      material(name, { roughness: 0.55 }),
      position,
      basket,
      scale,
    );
  }

  cylinder(0.24, 0.18, 0.42, material("accent-strong"), [-2.45, 0.21, 2.25]);
  const plant = new THREE.Group();
  plant.position.set(-2.45, 0.42, 2.25);
  for (let i = 0; i < 7; i += 1) {
    const leaf = new THREE.Group();
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    const blade = sphere(
      0.09,
      material("leaf", { roughness: 0.5 }),
      [0, 0.32, 0.1],
      leaf,
      [0.6, 3.6, 0.25],
    );
    blade.rotation.x = 0.45 + (i % 2) * 0.15;
    plant.add(leaf);
  }
  room.add(plant);

  // ---------- assembly intro ----------
  // Each top-level piece remembers where it belongs, starts hidden, and is
  // placed in build order: the floor spreads, walls rise, then cabinets,
  // appliances and props drop in one after another.
  type Piece = {
    object: THREE.Object3D;
    kind: Intro;
    start: number;
    position: THREE.Vector3;
    scale: THREE.Vector3;
  };
  const pieces: Piece[] = [];
  let order = 0;
  for (const object of room.children) {
    if (object.userData.skipIntro || object instanceof THREE.Light) continue;
    const kind = (object.userData.intro as Intro | undefined) ?? "drop";
    const start =
      kind === "floor"
        ? 0
        : kind === "wall"
          ? 0.35
          : 0.85 + Math.min(order++ * 0.028, 2.1);
    pieces.push({
      object,
      kind,
      start,
      position: object.position.clone(),
      scale: object.scale.clone(),
    });
    object.scale.setScalar(0.0001);
  }
  const INTRO_DURATION = 0.6;
  const introEnd =
    Math.max(...pieces.map((piece) => piece.start)) + INTRO_DURATION;
  let assembled = false;

  // ---------- camera & controls ----------
  const hotspotObjects = room.children.filter(
    (child) => child.userData.hotspot,
  );
  const anchors: Partial<Record<HotspotId, THREE.Vector3>> = {
    cook: new THREE.Vector3(0.22, 1.62, -2.45),
    book: new THREE.Vector3(-2.9, 2.32, 0.18),
    add: new THREE.Vector3(2.06, 2.3, -2.4),
  };

  const restRadius = 14.6;
  const spherical = new THREE.Spherical(19, 0.78, Math.PI / 4 + 0.7);
  camera.position.setFromSpherical(spherical).add(target);
  camera.lookAt(target);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.3;
  controls.minAzimuthAngle = 0.12;
  controls.maxAzimuthAngle = Math.PI / 2 - 0.12;
  controls.enabled = false; // switched on after the intro camera move

  // ---------- interaction ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered: HotspotId | null = null;
  let downAt: { x: number; y: number } | null = null;
  /** The room leans toward the cursor; values ease toward their targets. */
  const lean = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const hotspotFromEvent = (event: PointerEvent): HotspotId | null => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hotspotObjects, true)[0];
    let node: THREE.Object3D | null = hit?.object ?? null;
    while (node && !node.userData.hotspot) node = node.parent;
    return (node?.userData.hotspot as HotspotId | undefined) ?? null;
  };

  const glow = token("accent-strong");
  const noGlow = new THREE.Color(0);
  const setHover = (id: HotspotId | null) => {
    if (id === hovered) return;
    hovered = id;
    for (const object of hotspotObjects) {
      const active = object.userData.hotspot === id;
      object.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.emissive.copy(active ? glow : noGlow);
          child.material.emissiveIntensity = active ? 0.25 : 0;
        }
      });
    }
    canvas.style.cursor = id ? "pointer" : options.orbit ? "grab" : "default";
    options.onHoverChange(id);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setHover(hotspotFromEvent(event));
  };
  const onLeave = () => setHover(null);
  const onDown = (event: PointerEvent) => {
    downAt = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event: PointerEvent) => {
    if (!downAt) return;
    const moved = Math.hypot(
      event.clientX - downAt.x,
      event.clientY - downAt.y,
    );
    downAt = null;
    if (moved > 6) return;
    const id = hotspotFromEvent(event);
    if (id) options.onHotspot(id);
  };
  const onWindowMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    const dx =
      (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
    const dy =
      (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
    lean.targetY = Math.max(-1, Math.min(1, dx)) * 0.2;
    lean.targetX = Math.max(-1, Math.min(1, dy)) * 0.06;
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  window.addEventListener("pointermove", onWindowMove, { passive: true });

  // ---------- effects ----------
  let night = 0;
  let nightTarget = 0;
  let burstUntil = -1;

  // ---------- sizing ----------
  const resize = () => {
    const { clientWidth: width, clientHeight: height } =
      canvas.parentElement ?? canvas;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);
  resize();

  // ---------- loop ----------
  let visible = true;
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  intersection.observe(canvas);

  const timer = new THREE.Timer();
  const projected = new THREE.Vector3();
  let frame = 0;

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    timer.update(now);
    const t = timer.getElapsed();

    if (!assembled) {
      for (const piece of pieces) {
        const p = clamp01((t - piece.start) / INTRO_DURATION);
        const { object, position, scale } = piece;
        if (piece.kind === "floor") {
          const s = Math.max(0.0001, easeOutCubic(p));
          object.scale.set(scale.x * s, scale.y, scale.z * s);
        } else if (piece.kind === "wall") {
          const s = Math.max(0.0001, easeOutCubic(p));
          object.scale.set(scale.x, scale.y * s, scale.z);
          object.position.set(position.x, position.y * s, position.z);
        } else {
          const s = Math.max(0.0001, easeOutBack(p));
          object.scale.copy(scale).multiplyScalar(s);
          object.position.set(
            position.x,
            position.y + (1 - easeOutCubic(p)) * 1.8,
            position.z,
          );
        }
      }
      // The camera swings round and settles while the kitchen builds.
      const c = easeOutCubic(clamp01(t / (introEnd + 0.4)));
      spherical.radius = 19 + (restRadius - 19) * c;
      spherical.theta = Math.PI / 4 + 0.7 * (1 - c);
      spherical.phi = 0.78 + (1.02 - 0.78) * c;
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
      if (t > introEnd + 0.4) {
        assembled = true;
        for (const piece of pieces) {
          piece.object.scale.copy(piece.scale);
          piece.object.position.copy(piece.position);
        }
        controls.enabled = options.orbit;
        options.onAssembled();
      }
    } else {
      controls.update();
    }

    lean.x += (lean.targetX - lean.x) * 0.05;
    lean.y += (lean.targetY - lean.y) * 0.05;
    room.rotation.set(lean.x, lean.y, 0);

    for (const flame of flames) {
      const p = flame.userData.phase as number;
      flame.scale.y =
        0.75 + Math.sin(t * 18 + p) * 0.18 + Math.sin(t * 31 + p * 2) * 0.12;
    }
    flameLight.intensity =
      1.2 + Math.sin(t * 23) * 0.2 + Math.sin(t * 37) * 0.15;

    const bursting = t < burstUntil;
    const speed = bursting ? 0.9 : 0.32;
    steam.forEach((puff, i) => {
      const phase =
        (((t * speed + (puff.userData.phase as number)) % 1) + 1) % 1;
      puff.position.set(
        -0.22 + Math.sin(t * 1.3 + i) * 0.06 * phase,
        1.34 + phase * (bursting ? 1.3 : 0.75),
        -2.66 + Math.cos(t + i) * 0.05 * phase,
      );
      puff.scale.setScalar(
        (bursting ? 0.8 : 0.5) + phase * (bursting ? 2.6 : 1.8),
      );
      const shown = assembled && i < (bursting ? 22 : 14) ? 1 : 0;
      (puff.material as THREE.MeshStandardMaterial).opacity =
        shown * (bursting ? 0.75 : 0.5) * (1 - phase);
    });
    whistle.position.y =
      1.275 + (bursting ? Math.abs(Math.sin(t * 30)) * 0.025 : 0);

    for (const bubble of bubbles) {
      bubble.scale.setScalar(
        Math.max(0, Math.sin(t * 2.6 + (bubble.userData.phase as number))),
      );
    }

    plant.rotation.z = Math.sin(t * 0.8) * 0.035;
    tulsi.rotation.z = Math.sin(t * 1.1 + 1) * 0.03;

    // Day / night blend
    night += (nightTarget - night) * 0.05;
    hemi.intensity = 1.1 - night * 0.8;
    sun.intensity = 2.1 - night * 1.85;
    windowLight.intensity = 3 - night * 2.6;
    lamp.intensity = night * 6;
    glass.color.copy(dayGlass).lerp(nightGlass, night);
    moonMat.opacity = night;
    renderer.toneMappingExposure = 1.05 - night * 0.15;

    const date = new Date();
    const minutes = date.getMinutes() + date.getSeconds() / 60;
    minuteHand.rotation.z = -(minutes / 60) * Math.PI * 2;
    hourHand.rotation.z =
      -(((date.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2;

    renderer.render(scene, camera);

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    room.updateMatrixWorld();
    for (const id of Object.keys(anchors) as HotspotId[]) {
      const pin = options.pins[id];
      const anchor = anchors[id];
      if (!pin || !anchor) continue;
      projected.copy(anchor);
      room.localToWorld(projected);
      projected.project(camera);
      const x = ((projected.x + 1) / 2) * width;
      const y = ((1 - projected.y) / 2) * height;
      pin.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      pin.style.opacity = assembled ? "1" : "0";
    }
  };
  frame = requestAnimationFrame(tick);

  return {
    trigger(id) {
      if (id === "cooker") burstUntil = timer.getElapsed() + 2.6;
      if (id === "window") nightTarget = nightTarget ? 0 : 1;
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onWindowMove);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          for (const mat of materials) {
            (mat as THREE.MeshStandardMaterial).map?.dispose();
            mat.dispose();
          }
        }
      });
      renderer.dispose();
    },
  };
}
