'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowsClockwise, Sun, Moon, Cube, Cursor, Buildings } from '@phosphor-icons/react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function HouseScene({ hero = false }: { hero?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const sceneState = useRef<{
    roof: THREE.Group;
    streetContext: THREE.Group;
    windows: THREE.MeshPhysicalMaterial;
    light: THREE.DirectionalLight;
    ambient: THREE.HemisphereLight;
    controls: OrbitControls;
  } | null>(null);
  const [night, setNight] = useState(false);
  const [cutaway, setCutaway] = useState(false);
  const [street, setStreet] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(10, 8, 11);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 0.35;
    const ambient = new THREE.HemisphereLight('#fff9e8', '#7a886b', 2.4);
    scene.add(ambient);
    const light = new THREE.DirectionalLight('#fff3d6', 4);
    light.position.set(-3, 8, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -7;
    light.shadow.camera.right = 7;
    light.shadow.camera.top = 7;
    light.shadow.camera.bottom = -7;
    light.shadow.normalBias = 0.025;
    scene.add(light);
    const house = new THREE.Group();
    house.rotation.y = -0.15;
    scene.add(house);
    const mat = (color: string, roughness = 0.7) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const plaster = mat('#ece7db');
    const stone = mat('#b0a68e');
    const wood = mat('#79634a');
    const dark = mat('#373d34');
    const lawn = mat('#909f71');
    const paving = mat('#d2cdbd');
    const leaf = mat('#5c7650');
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#829b92',
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.75,
      clearcoat: 1,
      emissive: '#eac786',
      emissiveIntensity: 0.12,
    });
    const box = (
      w: number,
      h: number,
      d: number,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      group: THREE.Group = house,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };
    box(8.6, 0.24, 7, paving, 0, -0.22, 0);
    box(8.2, 0.12, 6.6, lawn, 0, -0.04, 0);
    box(4.3, 1.65, 2.9, plaster, -0.6, 0.86, -0.4);
    box(2.5, 1.45, 2.5, stone, 1.2, 0.75, -1.4);
    box(2.8, 1.55, 2.3, plaster, -0.9, 2.42, -0.85);
    const roof = new THREE.Group();
    house.add(roof);
    box(3.25, 0.16, 2.7, dark, -0.9, 3.27, -0.85, roof);
    box(4.7, 0.14, 3.2, plaster, -0.6, 1.75, -0.4, roof);
    box(2.65, 0.12, 2.7, paving, 1.2, 1.52, -1.4, roof);
    box(3.4, 1.15, 0.04, glass, -0.5, 0.87, 1.07);
    box(2.1, 1.1, 0.04, glass, -0.9, 2.48, 0.31);
    [-2, -0.9, 0.2, 1].forEach((x) => box(0.045, 1.22, 0.08, dark, x, 0.88, 1.1));
    box(3.6, 0.055, 0.08, dark, -0.5, 1.46, 1.1);
    box(3.6, 0.055, 0.08, dark, -0.5, 0.29, 1.1);
    box(0.8, 1.5, 0.08, wood, 1.5, 0.75, 0.3);
    for (let i = 0; i < 14; i++) box(0.045, 1.55, 0.065, wood, -2.72, 0.88, -1.68 + i * 0.19);
    box(4.4, 0.12, 1.35, wood, -0.45, 0.08, 1.68);
    for (let i = 0; i < 22; i++) box(0.025, 0.012, 1.35, stone, -2.5 + i * 0.2, 0.147, 1.68);
    box(1.15, 0.18, 0.6, plaster, -1.2, 0.25, 1.65);
    box(1.15, 0.18, 0.14, plaster, -1.2, 0.4, 1.9);
    box(0.7, 0.16, 0.5, wood, 0.35, 0.25, 1.6);
    box(1.85, 0.08, 2.1, stone, 2.2, 0.01, 1.55);
    const water = new THREE.MeshPhysicalMaterial({
      color: '#83b6a5',
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
    });
    box(1.58, 0.07, 1.88, water, 2.2, 0.07, 1.55);
    for (let i = 0; i < 4; i++) box(0.6, 0.07, 0.34, paving, -0.7, 0.04, 2.65 + i * 0.18);
    const tree = (x: number, z: number, s = 1) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07 * s, 0.11 * s, 1.1 * s, 10),
        wood,
      );
      trunk.position.set(x, 0.55 * s, z);
      house.add(trunk);
      const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 2), leaf);
      canopy.scale.set(1, 1.5, 1);
      canopy.position.set(x, 1.35 * s, z);
      canopy.castShadow = true;
      house.add(canopy);
    };
    tree(-3.3, -2.4, 1.3);
    tree(3.3, -2.3, 1.05);
    tree(-3.4, 1.8, 0.8);
    for (let i = 0; i < 10; i++) {
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), leaf);
      shrub.position.set(-3.6 + i * 0.72, 0.17, -2.9);
      shrub.scale.set(1, 1, 1.3);
      shrub.castShadow = true;
      house.add(shrub);
    }
    box(0.8, 0.65, 0.35, wood, -1.4, 0.38, -0.2);
    box(1.6, 0.12, 0.8, plaster, -0.5, 0.16, -0.1);
    // Conceptual neighbourhood context only: not a survey, safety score or property data.
    const streetContext = new THREE.Group();
    streetContext.visible = false;
    house.add(streetContext);
    box(11.8, 0.045, 1.15, dark, 0, -0.26, 5.1, streetContext);
    for (const x of [-3.4, -1.2, 1.1, 3.3]) {
      box(0.55, 0.015, 0.045, paving, x, -0.231, 5.1, streetContext);
    }
    for (const x of [-6.6, 6.6]) {
      box(2.2, 0.12, 3.2, lawn, x, -0.15, -0.6, streetContext);
      box(1.55, 1.12, 1.6, plaster, x, 0.44, -0.6, streetContext);
      box(1.8, 0.13, 1.9, stone, x, 1.07, -0.6, streetContext);
      box(0.44, 0.52, 0.035, glass, x, 0.52, 0.23, streetContext);
    }
    sceneState.current = { roof, streetContext, windows: glass, light, ambient, controls };
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    let visible = true;
    const intersection = new IntersectionObserver(
      (entries) => (visible = entries[0].isIntersecting),
    );
    intersection.observe(el);
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material) ? o.material : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      el.removeChild(renderer.domElement);
      sceneState.current = null;
    };
  }, []);
  useEffect(() => {
    const s = sceneState.current;
    if (!s) return;
    s.light.intensity = night ? 0.55 : 4;
    s.ambient.intensity = night ? 0.8 : 2.4;
    s.windows.emissiveIntensity = night ? 1.8 : 0.12;
  }, [night]);
  useEffect(() => {
    if (sceneState.current) sceneState.current.roof.visible = !cutaway;
  }, [cutaway]);
  useEffect(() => {
    const current = sceneState.current;
    if (!current) return;
    current.streetContext.visible = street;
    current.controls.object.position.set(street ? 15 : 10, street ? 11 : 8, street ? 17 : 11);
    current.controls.update();
  }, [street]);
  return (
    <div className={`house-scene ${hero ? 'hero-scene' : ''} ${night ? 'night' : ''}`}>
      <div
        className="scene-canvas"
        ref={host}
        role="img"
        aria-label="Interactive representative architectural model of a modern South African home"
      />
      {failed && (
        <div className="scene-fallback">
          <img src="/images/hero-house.jpg" alt="A modern home with a landscaped garden" />
          <span>3D needs a WebGL-capable browser.</span>
        </div>
      )}
      <div className="scene-caption">
        <Cursor size={14} />
        Drag to explore<span>{street ? 'Illustrative street context' : 'Concept model'}</span>
      </div>
      <div className="scene-controls">
        <button
          className={street ? 'selected' : ''}
          onClick={() => setStreet((value) => !value)}
          aria-label={
            street ? 'Hide illustrative street context' : 'Show illustrative street context'
          }
          aria-pressed={street}
          title="Illustrative surroundings, not real property data"
        >
          <Buildings size={20} />
        </button>
        <button
          className={night ? 'selected' : ''}
          onClick={() => setNight((v) => !v)}
          aria-label={night ? 'Switch to daytime' : 'Switch to evening'}
          aria-pressed={night}
        >
          {night ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button
          className={cutaway ? 'selected' : ''}
          onClick={() => setCutaway((v) => !v)}
          aria-label="Toggle roof cutaway"
          aria-pressed={cutaway}
        >
          <Cube size={20} />
        </button>
        <button
          onClick={() => {
            sceneState.current?.controls.reset();
            setNight(false);
            setCutaway(false);
            setStreet(false);
          }}
          aria-label="Reset model"
        >
          <ArrowsClockwise size={20} />
        </button>
      </div>
    </div>
  );
}
