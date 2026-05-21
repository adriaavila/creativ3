"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const COLOR_INK = 0x0a0d10;
const COLOR_LIMA = 0xc5f04a;
const COLOR_LIMA_DIM = 0x6f8b2e;

export default function HeroScene3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const getSize = () => {
      const r = host.getBoundingClientRect();
      return { w: Math.max(r.width, 1), h: Math.max(r.height, 1) };
    };

    let { w, h } = getSize();

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.3, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const composer = new EffectComposer(renderer);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.85,
      0.55,
      0.72
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const group = new THREE.Group();
    scene.add(group);

    // Central torus knot - chrome glass
    const knotGeo = new THREE.TorusKnotGeometry(0.95, 0.32, 220, 32, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2030,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.6,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    group.add(knot);

    // Outer ring 1
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.045, 24, 200);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: COLOR_LIMA,
      emissive: COLOR_LIMA,
      emissiveIntensity: 2.4,
      metalness: 0.6,
      roughness: 0.3,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.set(Math.PI / 2.4, 0, 0.2);
    group.add(ring1);

    // Outer ring 2 - chrome
    const ring2Geo = new THREE.TorusGeometry(2.25, 0.025, 16, 200);
    const ring2Mat = new THREE.MeshPhysicalMaterial({
      color: 0xb8c2cf,
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 2,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.set(Math.PI / 3, 0.3, -0.4);
    group.add(ring2);

    // Ground emitter disc
    const discGeo = new THREE.RingGeometry(1.4, 2.6, 64);
    const discMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          float r = distance(vUv, vec2(0.5));
          float pulse = 0.5 + 0.5 * sin(uTime * 1.5);
          float a = smoothstep(0.5, 0.15, r) * (0.35 + 0.25 * pulse);
          vec3 col = mix(vec3(0.04, 0.05, 0.06), vec3(0.77, 0.94, 0.29), 1.0 - r);
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -1.6;
    scene.add(disc);

    // Bubble cloud
    const BUBBLE_COUNT = 26;
    const bubbleGeo = new THREE.SphereGeometry(1, 24, 18);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.12,
      transmission: 0.85,
      thickness: 0.4,
      ior: 1.35,
      clearcoat: 1,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.4,
    });
    const bubbles = new THREE.InstancedMesh(
      bubbleGeo,
      bubbleMat,
      BUBBLE_COUNT
    );
    const bubbleData: { basePos: THREE.Vector3; speed: number; phase: number; scale: number }[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const angle = (i / BUBBLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 2.0 + Math.random() * 1.3;
      const x = Math.cos(angle) * radius;
      const z = -0.5 + (Math.random() - 0.5) * 2.4;
      const y = -0.4 + Math.random() * 2.2;
      const scale = 0.05 + Math.random() * 0.13;
      bubbleData.push({
        basePos: new THREE.Vector3(x, y, z),
        speed: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        scale,
      });
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
    scene.add(bubbles);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3, 5, 5);
    scene.add(key);
    const limaLight = new THREE.PointLight(COLOR_LIMA, 8, 14);
    limaLight.position.set(0, -1.2, 1.5);
    scene.add(limaLight);
    const rim = new THREE.PointLight(0x4a90e2, 4, 12);
    rim.position.set(-4, 1, -2);
    scene.add(rim);

    // Interaction
    let mouseX = 0;
    let mouseY = 0;
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    const onResize = () => {
      const s = getSize();
      w = s.w;
      h = s.h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloom.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    io.observe(host);

    const t0 = performance.now();
    let frameId = 0;

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      if (!visible) return;

      const t = (performance.now() - t0) / 1000;

      if (!prefersReducedMotion) {
        knot.rotation.x = t * 0.18;
        knot.rotation.y = t * 0.22;
        ring1.rotation.z = t * 0.12 + 0.2;
        ring2.rotation.z = -t * 0.08 - 0.4;
        ring2.rotation.x = Math.PI / 3 + Math.sin(t * 0.3) * 0.06;
      }

      const targetRotY = mouseX * 0.35;
      const targetRotX = -mouseY * 0.18;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.05;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.05;

      // animate bubbles
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const d = bubbleData[i];
        const yFloat = d.basePos.y + Math.sin(t * d.speed + d.phase) * 0.25;
        const xDrift = d.basePos.x + Math.cos(t * d.speed * 0.6 + d.phase) * 0.1;
        dummy.position.set(xDrift, yFloat, d.basePos.z);
        dummy.scale.setScalar(d.scale);
        dummy.rotation.y = t * d.speed * 0.5;
        dummy.updateMatrix();
        bubbles.setMatrixAt(i, dummy.matrix);
      }
      bubbles.instanceMatrix.needsUpdate = true;

      discMat.uniforms.uTime.value = t;
      limaLight.intensity = 7 + Math.sin(t * 1.8) * 2;

      composer.render();
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      knotGeo.dispose();
      knotMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      discGeo.dispose();
      discMat.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      envTex.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      style={{ background: `radial-gradient(ellipse at 60% 50%, rgba(197,240,74,0.05) 0%, transparent 60%)` }}
    />
  );
}
