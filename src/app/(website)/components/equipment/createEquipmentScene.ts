import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export interface EquipmentScene {
  /** Pause rendering while the section is far off screen. */
  setActive: (active: boolean) => void
  dispose: () => void
}

export interface EquipmentOptions {
  /** Scroll progress through the section, 0..1. */
  getProgress: () => number
  /** Pointer position, each axis -1..1. */
  getPointer: () => { x: number; y: number }
  /** Reduced motion: draw one still frame and never animate. */
  still: boolean
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (edge0: number, edge1: number, t: number) => {
  const x = clamp01((t - edge0) / (edge1 - edge0))
  return x * x * (3 - 2 * x)
}

// --- MATERIALS ------------------------------------------------------------------------------

function makeMaterials() {
  return {
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.16, clearcoat: 0.4 }),
    brushed: new THREE.MeshPhysicalMaterial({ color: 0xb4bac3, metalness: 1, roughness: 0.34 }),
    rubber: new THREE.MeshPhysicalMaterial({
      color: 0x0c0e11,
      roughness: 0.62,
      clearcoat: 0.18,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.55,
    }),
    faceDark: new THREE.MeshPhysicalMaterial({ color: 0x2b2f36, roughness: 0.45, clearcoat: 0.3 }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf3f4f6, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.1 }),
    teal: new THREE.MeshPhysicalMaterial({ color: 0x14b8a6, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }),
    graphite: new THREE.MeshPhysicalMaterial({ color: 0x3a3f48, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 }),
    // Glass is faked with a faint, reflective, non-depth-writing shell: cheaper and artefact-free
    // compared with real transmission, and it reads the same against a dark background.
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      transparent: true,
      opacity: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.7,
      depthWrite: false,
    }),
    liquid: new THREE.MeshPhysicalMaterial({
      color: 0x14b8a6,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1,
      emissive: 0x0b6b60,
      emissiveIntensity: 0.4,
    }),
  }
}
type Materials = ReturnType<typeof makeMaterials>

// --- STETHOSCOPE ----------------------------------------------------------------------------

function tube(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 24, false), material)
  return { mesh, curve }
}

/** A short cylinder wrapped around a tube at parameter t (the metal collars where parts join). */
function collar(curve: THREE.CatmullRomCurve3, t: number, radius: number, length: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 32), material)
  mesh.position.copy(curve.getPointAt(t))
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), curve.getTangentAt(t))
  return mesh
}

function buildChestPiece(m: Materials) {
  const g = new THREE.Group()

  // Bell housing: revolved profile, flat face at y = 0 and a dome above it, then turned so the
  // face looks along +z.
  const profile = [
    [0, 0],
    [2.7, 0],
    [3.05, 0.15],
    [3.2, 0.55],
    [3.0, 1.0],
    [2.2, 1.45],
    [1.3, 1.75],
    [0.85, 2.1],
    [0.7, 2.5],
    [0, 2.55],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const bell = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), m.chrome)
  bell.rotation.x = -Math.PI / 2

  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.3, 24, 96), m.rubber)
  rim.position.z = 0.05
  const face = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.16, 96), m.faceDark)
  face.rotation.x = Math.PI / 2
  face.position.z = 0.1

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 2.4, 32), m.chrome)
  stem.position.set(0, 4.2, -0.7)

  g.add(bell, rim, face, stem)
  return g
}

function buildStethoscope(m: Materials) {
  const g = new THREE.Group()

  // Binaural headset (metal) and the rubber tubing that carries on from it, mirrored left/right.
  for (const side of [-1, 1]) {
    const metal = tube(
      [V(3.1 * side, 17.4, 0.4), V(5.0 * side, 15.2, 0.2), V(4.9 * side, 12.4, 0)],
      0.34,
      m.chrome,
    )
    g.add(metal.mesh, collar(metal.curve, 0.98, 0.56, 0.9, m.brushed))

    const earTip = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), m.rubber)
    earTip.scale.set(1, 1.15, 1)
    earTip.position.set(3.0 * side, 17.7, 0.45)
    g.add(earTip)

    const rubber = tube([V(4.9 * side, 12.4, 0), V(4.8 * side, 9.4, 0), V(3.0 * side, 6.9, 0.1), V(0, 5.8, 0)], 0.5, m.rubber)
    g.add(rubber.mesh)
  }

  const junction = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), m.chrome)
  junction.scale.set(1, 1.2, 1)
  junction.position.set(0, 5.6, 0)
  g.add(junction)

  // Chest piece first, so the main tube can be routed to the tip of its stem.
  const chest = buildChestPiece(m)
  chest.position.set(-8.6, -15.2, 0.6)
  chest.rotation.set(-0.28, 0.3, 0.12)
  g.add(chest)
  g.updateMatrixWorld(true)
  const stemTip = chest.localToWorld(V(0, 5.4, -0.7))

  const main = tube(
    [
      V(0, 5.8, 0),
      V(0.1, 2.2, 0.5),
      V(-0.6, -2.0, 1.7),
      V(-3.4, -5.4, 2.1),
      V(stemTip.x + 2.2, stemTip.y + 3.4, stemTip.z + 0.9),
      stemTip,
    ],
    0.62,
    m.rubber,
  )
  g.add(main.mesh, collar(main.curve, 0.985, 0.82, 0.8, m.brushed))
  return g
}

// --- SYRINGE --------------------------------------------------------------------------------

function buildSyringe(m: Materials) {
  const g = new THREE.Group()
  const cyl = (rTop: number, rBottom: number, h: number, material: THREE.Material, y: number, radial = 48) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, radial), material)
    mesh.position.y = y
    return mesh
  }

  // Barrel spans y -6..6; the needle points down.
  g.add(cyl(1.15, 1.15, 12, m.glass, 0, 64))
  g.add(cyl(0.98, 0.98, 7.2, m.liquid, -2.1))

  // Plunger: cross-section rod, rubber stopper riding on the liquid, thumb disc.
  g.add(cyl(1.0, 1.0, 1.0, m.rubber, 1.9))
  const rodA = new THREE.Mesh(new THREE.BoxGeometry(1.6, 11.5, 0.22), m.white)
  const rodB = new THREE.Mesh(new THREE.BoxGeometry(0.22, 11.5, 1.6), m.white)
  rodA.position.y = rodB.position.y = 8.1
  g.add(rodA, rodB, cyl(1.9, 1.9, 0.4, m.white, 14))

  // Finger flange: an oval collar at the open end.
  const flange = cyl(2.5, 2.5, 0.35, m.white, 5.7)
  flange.scale.z = 0.5
  g.add(flange)

  // Graduation marks on the front of the barrel.
  for (let i = 0; i <= 10; i++) {
    const major = i % 5 === 0
    const mark = new THREE.Mesh(new THREE.BoxGeometry(major ? 0.9 : 0.55, 0.05, 0.05), m.graphite)
    mark.position.set(-0.2, -5 + i * 0.95, 1.17)
    g.add(mark)
  }

  // Nozzle, luer hub and needle.
  g.add(cyl(0.65, 0.4, 1.2, m.white, -6.6, 32))
  g.add(cyl(0.8, 0.55, 1.5, m.teal, -7.6, 32))
  g.add(cyl(0.16, 0.13, 8.6, m.chrome, -12.65, 16))
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.0, 16), m.chrome)
  tip.rotation.x = Math.PI
  tip.position.y = -17.45
  g.add(tip)

  return g
}

// --- CAPSULE --------------------------------------------------------------------------------

function buildPill(left: THREE.Material, right: THREE.Material) {
  const g = new THREE.Group()
  const r = 0.9
  const half = (material: THREE.Material, side: -1 | 1) => {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.9, 48), material)
    body.rotation.z = Math.PI / 2
    body.position.x = 0.95 * side
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), material)
    cap.rotation.z = (-Math.PI / 2) * side
    cap.position.x = 1.9 * side
    return [body, cap]
  }
  g.add(...half(left, -1), ...half(right, 1))
  const seam = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.035, 12, 48), new THREE.MeshStandardMaterial({ color: 0x20242a }))
  seam.rotation.y = Math.PI / 2
  g.add(seam)
  return g
}

// --- SCENE ----------------------------------------------------------------------------------

interface Piece {
  /** Placement, scale and the fly-in; its child `model` carries the continuous motion. */
  pivot: THREE.Group
  model: THREE.Object3D
  home: THREE.Vector3
  /** Where it drifts in from (and back out to) as the section fades in and out. */
  away: THREE.Vector3
  /** How far it slides with scroll; larger = nearer the viewer. */
  depth: number
  scale: number
  /** Static pose. */
  tilt: THREE.Euler
  /** Continuous tumble in rad/s about the model's own axes. Ignored when `sway` is set. */
  spin: THREE.Vector3
  /** If set, the model rocks back and forth by this many radians instead of tumbling. */
  sway: number
}

export function createEquipmentScene(host: HTMLElement, options: EquipmentOptions): EquipmentScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envTarget = pmrem.fromScene(room, 0.04)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 0.95
  room.dispose()

  const key = new THREE.DirectionalLight(0xfff1e0, 2.2)
  key.position.set(30, 40, 50)
  const rim = new THREE.DirectionalLight(0x9ad7ff, 2.4)
  rim.position.set(-40, 20, -30)
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.12))

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 500)

  const m = makeMaterials()
  const rig = new THREE.Group()
  scene.add(rig)

  const piece = (
    model: THREE.Object3D,
    home: THREE.Vector3,
    away: THREE.Vector3,
    options: { depth: number; scale: number; tilt?: THREE.Euler; spin?: THREE.Vector3; sway?: number },
  ): Piece => {
    const pivot = new THREE.Group()
    pivot.add(model)
    rig.add(pivot)
    return {
      pivot,
      model,
      home,
      away,
      depth: options.depth,
      scale: options.scale,
      tilt: options.tilt ?? new THREE.Euler(),
      spin: options.spin ?? V(0, 0, 0),
      sway: options.sway ?? 0,
    }
  }

  const pieces: Piece[] = [
    // The stethoscope rocks gently: it is a flat shape and would vanish edge-on if it turned fully.
    piece(buildStethoscope(m), V(-3, -2, 0), V(-14, -10, -40), { depth: 3, scale: 1.05, tilt: new THREE.Euler(0.05, -0.25, 0.03), sway: 0.32 }),
    // The syringe is tilted across the frame, then rolls about its own length.
    piece(buildSyringe(m), V(26, 6, -6), V(60, 30, -50), { depth: 8, scale: 1, tilt: new THREE.Euler(0.12, 0, 0.8), spin: V(0, 0.45, 0) }),
    piece(buildPill(m.white, m.teal), V(-27, 10, 14), V(-60, 30, 10), { depth: 15, scale: 1.2, tilt: new THREE.Euler(0.3, 0.2, 0.6), spin: V(0.5, 0.3, 0.4) }),
    piece(buildPill(m.graphite, m.white), V(22, -17, 16), V(60, -40, 20), { depth: 18, scale: 1, tilt: new THREE.Euler(0.1, 0.6, -0.5), spin: V(0.4, 0.5, 0.2) }),
    piece(buildPill(m.teal, m.teal), V(-19, -21, 8), V(-55, -44, 5), { depth: 12, scale: 0.75, tilt: new THREE.Euler(0.5, 0.1, 0.3), spin: V(0.3, 0.6, 0.5) }),
  ]

  // --- sizing: keep the whole arrangement in frame on tall phones as well as wide screens
  const resize = () => {
    const w = Math.max(1, host.clientWidth)
    const h = Math.max(1, host.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const needWidth = 82
    const dist = Math.max(120, needWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect))
    camera.position.set(0, 4, dist)
    camera.lookAt(0, 1, 0)
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(() => {
    resize()
    if (options.still) renderFrame(0)
  })
  resizeObserver.observe(host)
  resize()

  // --- animation
  const pointer = { x: 0, y: 0 }
  let last = performance.now()

  function renderFrame(time: number) {
    const now = performance.now()
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now

    const p = options.still ? 0.5 : clamp01(options.getProgress())
    // 0 = scattered and small, 1 = assembled. Rises over the first stretch, falls again at the end.
    const reveal = options.still ? 1 : smooth(0.1, 0.42, p) * (1 - smooth(0.68, 0.95, p))

    const target = options.getPointer()
    const follow = 1 - Math.exp(-dt * 3)
    pointer.x += (target.x - pointer.x) * follow
    pointer.y += (target.y - pointer.y) * follow

    for (const item of pieces) {
      const { pivot, model } = item
      pivot.position.lerpVectors(item.away, item.home, reveal)
      // Differential travel: nearer pieces slide further with scroll, which is what reads as depth.
      pivot.position.y += (0.5 - p) * item.depth * 1.6
      pivot.scale.setScalar(item.scale * lerp(0.5, 1, reveal))
      pivot.rotation.set(
        item.tilt.x + (1 - reveal) * 0.9,
        item.tilt.y + (1 - reveal) * 1.4,
        item.tilt.z + (1 - reveal) * 0.6,
      )
      if (item.sway) model.rotation.set(0, Math.sin(time * 0.45) * item.sway, 0)
      else model.rotation.set(time * item.spin.x, time * item.spin.y, time * item.spin.z)
    }

    rig.rotation.y = lerp(-0.42, 0.42, p) + pointer.x * 0.14 + Math.sin(time * 0.3) * 0.03
    rig.rotation.x = -0.08 + Math.sin(p * Math.PI) * 0.1 - pointer.y * 0.07

    renderer.render(scene, camera)
  }

  let active = false
  const startedAt = performance.now()
  const setActive = (next: boolean) => {
    if (options.still || next === active) return
    active = next
    renderer.setAnimationLoop(next ? () => renderFrame((performance.now() - startedAt) / 1000) : null)
  }

  if (options.still) renderFrame(0)

  return {
    setActive,
    dispose() {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
      })
      Object.values(m).forEach((material) => material.dispose())
      envTarget.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
