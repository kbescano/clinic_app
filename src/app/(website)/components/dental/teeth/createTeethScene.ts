import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface TeethScene {
  /** Pause rendering while the section is far off screen. */
  setActive: (active: boolean) => void
  dispose: () => void
}

export interface TeethOptions {
  /** Progress through the pinned sequence, 0..1. */
  getProgress: () => number
  /** Pointer position, each axis -1..1. */
  getPointer: () => { x: number; y: number }
  /** Reduced motion: draw one still frame (whitened front view) and never animate. */
  still: boolean
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (e0: number, e1: number, t: number) => {
  const x = clamp01((t - e0) / (e1 - e0))
  return x * x * (3 - 2 * x)
}
/** Signed power: pushes a sphere towards a rounded box (p < 1) or a point (p > 1). */
const sq = (t: number, p: number) => Math.sign(t) * Math.pow(Math.abs(t), p)

// --- TOOTH SHAPES ---------------------------------------------------------------------------

type Kind = 'incisor' | 'lateral' | 'canine' | 'premolar' | 'molar'
interface Spec {
  kind: Kind
  /** Mesio-distal width, crown height, bucco-lingual thickness (mm). */
  w: number
  h: number
  t: number
}

// Midline outwards. Real crown proportions, slightly simplified.
const UPPER: Spec[] = [
  { kind: 'incisor', w: 8.6, h: 10.6, t: 7.0 },
  { kind: 'lateral', w: 6.6, h: 9.0, t: 6.2 },
  { kind: 'canine', w: 7.6, h: 10.2, t: 8.0 },
  { kind: 'premolar', w: 7.0, h: 8.2, t: 9.0 },
  { kind: 'premolar', w: 6.8, h: 7.8, t: 9.0 },
  { kind: 'molar', w: 10.2, h: 7.2, t: 11.0 },
  { kind: 'molar', w: 9.2, h: 6.8, t: 10.5 },
]
const LOWER: Spec[] = [
  { kind: 'incisor', w: 5.4, h: 9.0, t: 6.0 },
  { kind: 'lateral', w: 5.9, h: 9.2, t: 6.2 },
  { kind: 'canine', w: 6.9, h: 10.4, t: 7.6 },
  { kind: 'premolar', w: 7.0, h: 8.0, t: 8.0 },
  { kind: 'premolar', w: 7.1, h: 7.8, t: 8.4 },
  { kind: 'molar', w: 11.0, h: 7.4, t: 10.5 },
  { kind: 'molar', w: 10.5, h: 6.9, t: 10.2 },
]

const CERVICAL = new THREE.Color('#d9c49c')
const BODY = new THREE.Color('#f3ede1')
const EDGE = new THREE.Color('#f6f8ff')

/**
 * One crown, built by deforming a sphere. Local frame: x along the arch, y from the gum line (0) to
 * the biting edge (h), z outwards (the side you see when someone smiles).
 */
function toothGeometry({ kind, w, h, t }: Spec) {
  const front = kind === 'incisor' || kind === 'lateral'
  const [pw, ph, pt] =
    kind === 'canine' ? [0.68, 0.62, 0.78] : front ? [0.55, 0.5, 0.75] : [0.6, 0.55, 0.6]

  const sphere = new THREE.SphereGeometry(1, 44, 30)
  sphere.deleteAttribute('normal')
  sphere.deleteAttribute('uv')
  const geo = mergeVertices(sphere, 1e-5)
  sphere.dispose()

  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i)
    const b = pos.getY(i)
    const d = pos.getZ(i)
    const u = sq(a, pw)
    const v = sq(b, ph)
    const s = sq(d, pt)
    const y01 = (v + 1) / 2

    let wf: number
    let tf: number
    let lift = 0
    const occl = smooth(0.72, 1, y01)
    switch (kind) {
      case 'incisor':
      case 'lateral':
        // Narrow at the neck, widest near the edge, thin chisel-like biting edge.
        wf = lerp(0.62, 1, smooth(0, 0.6, y01)) * (1 - 0.08 * smooth(0.9, 1, y01))
        tf = lerp(1, 0.42, smooth(0.25, 1, y01))
        break
      case 'canine':
        // Tapers to a single, rounded cusp.
        wf = lerp(0.72, 1, smooth(0, 0.35, y01)) * (1 - 0.55 * Math.pow(smooth(0.55, 1, y01), 1.6))
        tf = lerp(1, 0.66, smooth(0.35, 1, y01)) * (1 - 0.3 * Math.pow(smooth(0.6, 1, y01), 1.6))
        break
      case 'premolar':
        wf = lerp(0.72, 1, smooth(0, 0.5, y01))
        tf = lerp(0.85, 1, smooth(0, 0.5, y01))
        // Two cusps (cheek side and tongue side) with a groove between.
        lift = h * 0.13 * occl * (Math.pow(Math.abs(s), 1.2) - 0.45)
        break
      default:
        wf = lerp(0.82, 1, smooth(0, 0.45, y01))
        tf = lerp(0.85, 1, smooth(0, 0.45, y01))
        // Four cusps at the corners around a central pit.
        lift = h * 0.13 * occl * (smooth(0.15, 0.85, Math.abs(u)) * smooth(0.15, 0.85, Math.abs(s)) * 1.6 - 0.45)
    }

    pos.setXYZ(i, (w / 2) * u * wf, h * y01 + lift, (t / 2) * s * tf)

    // Warmer at the gum line, near-white body, a cool translucent edge on the front teeth.
    if (y01 < 0.4) c.copy(CERVICAL).lerp(BODY, smooth(0, 0.4, y01))
    else c.copy(BODY).lerp(EDGE, smooth(0.78, 1, y01) * (front ? 1 : 0.35))
    colors.set([c.r, c.g, c.b], i * 3)
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

// --- ARCH LAYOUT ----------------------------------------------------------------------------

/** A parabolic arch sampled by arc length: front teeth at +z, molars curving back to -z. */
function archSampler(curvature: number, scale: number) {
  const pts: { s: number; x: number; z: number }[] = []
  let s = 0
  let px = 0
  let pz = 0
  for (let x = 0; x <= 60; x += 0.05) {
    const z = -curvature * x * x
    if (x > 0) s += Math.hypot(x - px, z - pz)
    pts.push({ s, x, z })
    px = x
    pz = z
  }
  return (arc: number) => {
    let i = pts.findIndex((p) => p.s >= arc)
    if (i <= 0) i = 1
    const p = pts[i]
    const q = pts[i - 1]
    const len = Math.hypot(p.x - q.x, p.z - q.z)
    return { x: p.x * scale, z: p.z * scale, tx: (p.x - q.x) / len, tz: (p.z - q.z) / len }
  }
}

const GUM_RADIUS = 4.8

interface PlacedTooth {
  mesh: THREE.Mesh
  base: THREE.Vector3
  spec: Spec
}

function buildJaw(specs: Spec[], upper: boolean, enamel: THREE.Material, gum: THREE.Material) {
  const group = new THREE.Group()
  const sample = archSampler(upper ? 0.03 : 0.032, upper ? 1 : 0.95)
  const teeth: PlacedTooth[] = []
  const gumPoints: THREE.Vector3[] = []

  for (const side of [1, -1]) {
    let arc = 0
    specs.forEach((spec, index) => {
      // Packed edge to edge (contacts touch), so the front teeth do not show a gap.
      const at = sample(arc + spec.w / 2 - (index === 0 ? 0.6 : 0))
      arc += spec.w - (index === 0 ? 0.6 : 0.25)
      const yaw = Math.atan2(-at.tz, at.tx) * side
      const mesh = new THREE.Mesh(toothGeometry(spec), enamel)
      // Front teeth lean outwards a little; upper ones more than lower. (The upper jaw is flipped
      // upside down, so outwards is the opposite sign there.)
      const lean = (index < 3 ? (upper ? 0.2 : 0.08) : 0.02) * (upper ? -1 : 1)
      mesh.rotation.set(lean, yaw, upper ? Math.PI : 0, 'YXZ')
      const base = new THREE.Vector3(at.x * side, upper ? spec.h : -spec.h, at.z)
      mesh.position.copy(base)
      group.add(mesh)
      teeth.push({ mesh, base, spec })

      // The gum runs just behind and beyond each tooth's neck, so from the front only a thin,
      // scalloped margin of gum overlaps the crown.
      const inward = new THREE.Vector3(at.tz * side, 0, -at.tx).normalize()
      const neck = upper ? spec.h + 1.2 : -spec.h - 1.2
      gumPoints.push(new THREE.Vector3(at.x * side, neck, at.z).addScaledVector(inward, 0.6))
    })
  }

  // Order the gum points from one end of the arch to the other: left molars ... right molars.
  const half = specs.length
  const ordered = [...gumPoints.slice(half).reverse(), ...gumPoints.slice(0, half)]
  const curve = new THREE.CatmullRomCurve3(ordered, false, 'centripetal')
  const gumMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, GUM_RADIUS, 28, false), gum)
  gumMesh.scale.y = 1.15
  group.add(gumMesh)
  for (const end of [ordered[0], ordered[ordered.length - 1]]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(GUM_RADIUS, 28, 20), gum)
    cap.position.copy(end)
    cap.scale.y = 1.15
    group.add(cap)
  }

  return { group, teeth }
}

// --- IMPLANT --------------------------------------------------------------------------------

function buildImplant(titanium: THREE.Material) {
  const screw = new THREE.Group()
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.35, 10, 40), titanium)
  core.position.y = 5
  screw.add(core)
  for (let i = 0; i < 8; i++) {
    const r = lerp(1.45, 2.05, i / 7)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.32, 12, 48), titanium)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.9 + i * 1.15
    screw.add(ring)
  }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.4, 40), titanium)
  tip.rotation.x = Math.PI
  tip.position.y = -0.7
  screw.add(tip)

  const abutment = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.7, 3.2, 40), titanium)
  return { screw, abutment }
}

// --- SCENE ----------------------------------------------------------------------------------

/** Camera and model state at points along the scroll. Values between keys are eased. */
const KEYS = [
  // p     yaw    pitch  open  dist  white  aligner  implant  upperFade
  [0.0, -0.55, 0.1, 3, 1.18, 0, 0, 0, 0],
  [0.12, 0.0, 0.06, 3, 1.0, 0, 0, 0, 0],
  [0.24, 0.22, 0.06, 3, 1.0, 0, 0, 0, 0],
  [0.32, 0.0, 0.02, 2, 0.92, 0.1, 0, 0, 0],
  [0.44, 0.0, 0.02, 2, 0.9, 1, 0, 0, 0],
  [0.54, -0.55, 0.24, 9, 1.0, 1, 0.2, 0, 0],
  [0.6, -0.75, 0.28, 11, 1.0, 1, 1, 0, 0],
  [0.7, -0.85, 0.3, 11, 1.0, 1, 1, 0, 0],
  [0.79, 0.25, 0.75, 22, 1.08, 1, 0, 0, 1],
  [0.9, 0.55, 0.92, 24, 1.0, 1, 0, 1, 1],
  [1.0, 0.65, 0.92, 24, 1.0, 1, 0, 1, 1],
] as const

function sampleKeys(p: number) {
  let i = 0
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = smooth(a[0], b[0], p)
  const v = (k: number) => lerp(a[k], b[k], t)
  return { yaw: v(1), pitch: v(2), open: v(3), dist: v(4), white: v(5), aligner: v(6), implant: v(7), upperFade: v(8) }
}

export function createTeethScene(host: HTMLElement, options: TeethOptions): TeethScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envTarget = pmrem.fromScene(room, 0.04)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 0.85
  room.dispose()

  const key = new THREE.DirectionalLight(0xfff4e8, 2.4)
  key.position.set(30, 50, 60)
  const rim = new THREE.DirectionalLight(0xffb08f, 2.2) // warm rim in the brand orange's family
  rim.position.set(-50, 20, -40)
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6)
  fill.position.set(0, -40, 30)
  scene.add(key, rim, fill, new THREE.AmbientLight(0xffffff, 0.15))

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 600)

  // Materials. Each jaw has its own so the upper one can fade away for the implant close-up.
  const STAINED = new THREE.Color('#dcc59a')
  const enamel = (opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
    new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      color: STAINED.clone(),
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      sheen: 0.35,
      sheenColor: new THREE.Color('#fff6ea'),
      ...opts,
    })
  const gumMaterial = () =>
    new THREE.MeshPhysicalMaterial({
      color: 0xd9707f,
      roughness: 0.42,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
      sheen: 0.6,
      sheenColor: new THREE.Color('#ffc2ca'),
    })
  const m = {
    enamelUpper: enamel(),
    enamelLower: enamel(),
    gumUpper: gumMaterial(),
    gumLower: gumMaterial(),
    aligner: new THREE.MeshPhysicalMaterial({
      color: 0x9fd8ff,
      roughness: 0.04,
      transparent: true,
      opacity: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.8,
      depthWrite: false,
    }),
    titanium: new THREE.MeshPhysicalMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.28, clearcoat: 0.3 }),
  }

  const rig = new THREE.Group()
  scene.add(rig)
  const model = new THREE.Group()
  model.position.z = 18 // rotate about the middle of the arch, not the front teeth
  rig.add(model)

  const upper = buildJaw(UPPER, true, m.enamelUpper, m.gumUpper)
  const lower = buildJaw(LOWER, false, m.enamelLower, m.gumLower)
  model.add(upper.group, lower.group)

  // Clear aligner: a slightly larger shell over every upper tooth.
  const alignerShell = new THREE.Group()
  for (const tooth of upper.teeth) {
    const shell = new THREE.Mesh(tooth.mesh.geometry, m.aligner)
    shell.position.copy(tooth.mesh.position)
    shell.rotation.copy(tooth.mesh.rotation)
    shell.scale.setScalar(1.08)
    shell.renderOrder = 2
    alignerShell.add(shell)
  }
  upper.group.add(alignerShell)

  // Implant: replaces the lower right first molar in the exploded view.
  const molar = lower.teeth[5]
  const implant = buildImplant(m.titanium)
  const implantGroup = new THREE.Group()
  implantGroup.position.set(molar.base.x, molar.base.y - 3, molar.base.z)
  implantGroup.rotation.y = molar.mesh.rotation.y
  implantGroup.add(implant.screw, implant.abutment)
  implantGroup.visible = false
  lower.group.add(implantGroup)

  // Scan: a bright orange band that travels up across the teeth and gums, like an intraoral
  // scanner's light, added to the materials' own emissive light.
  const scanUniforms = { uScanY: { value: -40 }, uScanStrength: { value: 0 } }
  for (const material of [m.enamelUpper, m.enamelLower, m.gumUpper, m.gumLower]) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uScanY = scanUniforms.uScanY
      shader.uniforms.uScanStrength = scanUniforms.uScanStrength
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vScanWorld;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvScanWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vScanWorld;\nuniform float uScanY;\nuniform float uScanStrength;')
        // Inside the band the final colour is replaced with the brand orange. (Tinting the surface
        // is not enough: clear-coat and sheen reflections wash any lit colour out to peach.) The
        // values are linear light, chosen so they land near #ff5e2b after tone mapping.
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float scanD = abs(vScanWorld.y - uScanY);
          float scanCore = uScanStrength * smoothstep(2.2, 0.4, scanD);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(1.0, 0.08, 0.015) * uScanStrength * smoothstep(7.0, 0.0, scanD) * 0.15;`,
        )
        .replace(
          '#include <opaque_fragment>',
          `outgoingLight = mix(outgoingLight, vec3(1.45, 0.085, 0.017), scanCore);
          #include <opaque_fragment>`,
        )
    }
    material.customProgramCacheKey = () => 'scan-band'
  }

  // --- sizing
  let baseDist = 150
  const resize = () => {
    const w = Math.max(1, host.clientWidth)
    const h = Math.max(1, host.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const needWidth = camera.aspect < 0.9 ? 82 : 100
    baseDist = Math.max(140, needWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect))
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(() => {
    resize()
    if (options.still) renderFrame(0)
  })
  resizeObserver.observe(host)
  resize()

  const white = new THREE.Color('#ffffff')
  const pointer = { x: 0, y: 0 }
  let last = performance.now()

  const fade = (material: THREE.Material, opacity: number) => {
    material.opacity = opacity
    const transparent = opacity < 0.999
    if (material.transparent !== transparent) {
      material.transparent = transparent
      material.depthWrite = !transparent
      material.needsUpdate = true
    }
  }

  function renderFrame(time: number) {
    const now = performance.now()
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now

    const p = options.still ? 0.46 : clamp01(options.getProgress())
    const k = sampleKeys(p)

    const target = options.getPointer()
    const follow = 1 - Math.exp(-dt * 3)
    pointer.x += (target.x - pointer.x) * follow
    pointer.y += (target.y - pointer.y) * follow

    // Whitening: the enamel tint moves from stained to clean white.
    m.enamelUpper.color.copy(STAINED).lerp(white, k.white)
    m.enamelLower.color.copy(STAINED).lerp(white, k.white)

    // Bite opens, the upper jaw fades for the implant close-up.
    upper.group.position.y = k.open / 2
    lower.group.position.y = -k.open / 2
    const upperOpacity = 1 - k.upperFade
    fade(m.enamelUpper, upperOpacity)
    fade(m.gumUpper, upperOpacity)
    upper.group.visible = upperOpacity > 0.01

    m.aligner.opacity = 0.55 * k.aligner * upperOpacity

    // Scan band travels up through both jaws and back down during the first stage.
    const sweep = smooth(0.04, 0.24, p)
    scanUniforms.uScanY.value = lerp(-17, 17, 0.5 - 0.5 * Math.cos(2 * Math.PI * sweep))
    scanUniforms.uScanStrength.value = options.still ? 0 : Math.sin(Math.PI * sweep)

    // Implant: the molar crown lifts away, the abutment and screw appear in an exploded stack.
    const lift = k.implant
    molar.mesh.position.y = molar.base.y + lift * 22
    molar.mesh.rotation.z = lift * 0.12
    implantGroup.visible = lift > 0.01
    implant.screw.position.y = lerp(-6, 0, lift)
    implant.abutment.position.y = lerp(4, 13.5, lift)
    implantGroup.scale.setScalar(Math.max(0.001, lift))

    rig.rotation.set(k.pitch - pointer.y * 0.06, k.yaw + pointer.x * 0.14 + Math.sin(time * 0.35) * 0.025, 0)
    camera.position.set(0, 2, baseDist * k.dist)
    camera.lookAt(0, 0, 0)

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
      const geometries = new Set<THREE.BufferGeometry>()
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh
        if (mesh.isMesh) geometries.add(mesh.geometry)
      })
      geometries.forEach((g) => g.dispose())
      Object.values(m).forEach((material) => material.dispose())
      envTarget.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
