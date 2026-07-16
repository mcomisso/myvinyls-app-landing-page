import { createThreeLayer, recordCenter, waitForOrganizer } from "./three-effect-utils.js";

const stage = document.querySelector("[data-record-organizer]");

if (stage) {
  waitForOrganizer(stage, (records) => {
    void createMagneticField(stage, records);
  });
}

async function createMagneticField(stageElement, records) {
  let layer;
  try {
    layer = await createThreeLayer(stageElement);
  } catch {
    return;
  }
  if (!layer) return;

  const { THREE, scene, render } = layer;
  const particleCount = 96;
  const trailCount = 3;
  const trailSegments = 10;
  const positions = new Float32Array(particleCount * 3);
  const alphas = new Float32Array(particleCount);
  const sizes = new Float32Array(particleCount);
  const particles = Array.from({ length: particleCount }, () => ({
    life: 0,
    maxLife: 1,
    vx: 0,
    vy: 0
  }));
  let particleCursor = 0;
  let frameRequest = null;
  let previousTime = 0;
  let energy = 0;
  let active = false;
  let disposed = false;
  let lastPointerTime = 0;
  let previousPointer = null;
  const pointer = new THREE.Vector2();

  positions.fill(-10000);

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aAlpha;
      attribute float aSize;
      varying float vAlpha;

      void main() {
        vAlpha = aAlpha;
        gl_PointSize = aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;

      void main() {
        float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
        float softness = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
        gl_FragColor = vec4(1.0, 0.49, 0.31, vAlpha * softness);
      }
    `
  });
  const particleCloud = new THREE.Points(particleGeometry, particleMaterial);
  particleCloud.frustumCulled = false;
  scene.add(particleCloud);

  const haloMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uOpacity;

      void main() {
        float radius = distance(vUv, vec2(0.5)) * 2.0;
        float glow = (1.0 - smoothstep(0.12, 1.0, radius)) * 0.18;
        float ring = smoothstep(0.34, 0.49, radius) * (1.0 - smoothstep(0.5, 0.72, radius));
        gl_FragColor = vec4(1.0, 0.43, 0.27, (glow + ring * 0.42) * uOpacity);
      }
    `
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), haloMaterial);
  halo.visible = false;
  scene.add(halo);

  const trailPositions = new Float32Array(trailCount * trailSegments * 2 * 3);
  const trailColors = new Float32Array(trailCount * trailSegments * 2 * 3);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const trails = new THREE.LineSegments(trailGeometry, trailMaterial);
  trails.frustumCulled = false;
  scene.add(trails);

  const resetRecordOffsets = () => {
    records.forEach((record) => {
      record.style.removeProperty("translate");
      record.style.removeProperty("rotate");
      record.style.removeProperty("will-change");
    });
  };

  const clearParticles = () => {
    particles.forEach((particle, index) => {
      particle.life = 0;
      positions[index * 3] = -10000;
      positions[index * 3 + 1] = -10000;
      alphas[index] = 0;
    });
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.aAlpha.needsUpdate = true;
  };

  const clearEffect = () => {
    active = false;
    energy = 0;
    lastPointerTime = 0;
    previousPointer = null;
    halo.visible = false;
    haloMaterial.uniforms.uOpacity.value = 0;
    trailMaterial.opacity = 0;
    clearParticles();
    resetRecordOffsets();
    if (frameRequest !== null) {
      cancelAnimationFrame(frameRequest);
      frameRequest = null;
    }
    render();
  };

  const spawnParticle = (x, y, speed, angle, life = 0.8) => {
    const index = particleCursor;
    particleCursor = (particleCursor + 1) % particleCount;
    const particle = particles[index];
    const positionIndex = index * 3;
    particle.life = life;
    particle.maxLife = life;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    positions[positionIndex] = x;
    positions[positionIndex + 1] = y;
    positions[positionIndex + 2] = 2;
    sizes[index] = 2.6 + Math.random() * 4.2;
    alphas[index] = 0.7;
  };

  const burstAt = (x, y) => {
    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2 + Math.random() * 0.22;
      spawnParticle(x, y, 42 + Math.random() * 95, angle, 0.55 + Math.random() * 0.35);
    }
    energy = 1;
    requestFrame();
  };

  const updateSleeves = () => {
    records.forEach((record) => {
      if (record.classList.contains("is-organized") || record.classList.contains("is-scanning")) {
        record.style.removeProperty("translate");
        record.style.removeProperty("rotate");
        return;
      }

      const center = recordCenter(stageElement, record);
      const dx = pointer.x - center.x;
      const dy = pointer.y - center.y;
      const distance = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - distance / 300) * energy;
      if (influence < 0.015) {
        record.style.removeProperty("translate");
        record.style.removeProperty("rotate");
        return;
      }

      record.style.willChange = "translate, rotate";
      record.style.translate = `${dx * influence * 0.025}px ${dy * influence * 0.025}px`;
      record.style.rotate = `${dx * influence * 0.004}deg`;
    });
  };

  const updateTrails = () => {
    const nearestRecords = records
      .filter((record) => !record.classList.contains("is-organized"))
      .map((record) => ({ record, center: recordCenter(stageElement, record) }))
      .map((entry) => ({ ...entry, distance: Math.hypot(entry.center.x - pointer.x, entry.center.y - pointer.y) }))
      .filter((entry) => entry.distance < 360)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, trailCount);

    trailPositions.fill(0);
    trailColors.fill(0);
    let vertex = 0;
    nearestRecords.forEach(({ center, distance }, trailIndex) => {
      const dx = center.x - pointer.x;
      const dy = center.y - pointer.y;
      const normalX = -dy / Math.max(distance, 1);
      const normalY = dx / Math.max(distance, 1);
      const bend = Math.min(distance * 0.12, 28) * (trailIndex % 2 === 0 ? 1 : -1);

      for (let segment = 0; segment < trailSegments; segment += 1) {
        for (let edge = 0; edge < 2; edge += 1) {
          const t = (segment + edge) / trailSegments;
          const arc = Math.sin(t * Math.PI) * bend;
          const positionIndex = vertex * 3;
          const brightness = Math.sin(t * Math.PI) * (1 - distance / 440);
          trailPositions[positionIndex] = pointer.x + dx * t + normalX * arc;
          trailPositions[positionIndex + 1] = pointer.y + dy * t + normalY * arc;
          trailPositions[positionIndex + 2] = 1;
          trailColors[positionIndex] = 1 * brightness;
          trailColors[positionIndex + 1] = 0.39 * brightness;
          trailColors[positionIndex + 2] = 0.22 * brightness;
          vertex += 1;
        }
      }
    });
    trailGeometry.setDrawRange(0, vertex);
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
    trailMaterial.opacity = Math.min(energy * 0.34, 0.34);
  };

  const animate = (time) => {
    frameRequest = null;
    if (disposed) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.034) : 1 / 60;
    previousTime = time;
    let livingParticles = 0;

    particles.forEach((particle, index) => {
      if (particle.life <= 0) return;
      const positionIndex = index * 3;
      const dx = pointer.x - positions[positionIndex];
      const dy = pointer.y - positions[positionIndex + 1];
      const distance = Math.max(Math.hypot(dx, dy), 18);
      const attraction = Math.min(950 / distance, 26);
      particle.vx += (dx / distance) * attraction * delta;
      particle.vy += (dy / distance) * attraction * delta;
      particle.vx += (-dy / distance) * 22 * delta;
      particle.vy += (dx / distance) * 22 * delta;
      particle.vx *= Math.pow(0.965, delta * 60);
      particle.vy *= Math.pow(0.965, delta * 60);
      positions[positionIndex] += particle.vx * delta;
      positions[positionIndex + 1] += particle.vy * delta;
      particle.life -= delta;
      const lifeRatio = Math.max(particle.life / particle.maxLife, 0);
      alphas[index] = Math.sin(Math.min(lifeRatio * Math.PI, Math.PI / 2)) * 0.72;
      livingParticles += particle.life > 0 ? 1 : 0;
    });

    if (active && time - lastPointerTime > 110) active = false;
    if (!active) energy = Math.max(0, energy - delta * 1.8);
    else energy = Math.max(0.32, energy - delta * 0.55);
    halo.visible = energy > 0.01;
    halo.position.set(pointer.x, pointer.y, 0);
    halo.scale.setScalar(0.92 + energy * 0.14);
    haloMaterial.uniforms.uOpacity.value = energy;
    updateSleeves();
    updateTrails();
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.aAlpha.needsUpdate = true;
    particleGeometry.attributes.aSize.needsUpdate = true;
    render();

    if (active || livingParticles > 0 || energy > 0.01) requestFrame();
    else resetRecordOffsets();
  };

  function requestFrame() {
    if (frameRequest === null && !disposed) frameRequest = requestAnimationFrame(animate);
  }

  const onPointerMove = (event) => {
    const bounds = stageElement.getBoundingClientRect();
    const nextX = event.clientX - bounds.left;
    const nextY = event.clientY - bounds.top;
    const last = previousPointer ?? { x: nextX, y: nextY };
    const distance = Math.hypot(nextX - last.x, nextY - last.y);
    const steps = Math.min(Math.max(Math.ceil(distance / 9), 2), 9);
    pointer.set(nextX, nextY);
    active = true;
    lastPointerTime = performance.now();
    energy = Math.min(1, Math.max(energy, 0.38) + distance * 0.012);

    for (let index = 0; index < steps; index += 1) {
      const progress = (index + 1) / steps;
      const x = last.x + (nextX - last.x) * progress + (Math.random() - 0.5) * 14;
      const y = last.y + (nextY - last.y) * progress + (Math.random() - 0.5) * 14;
      const angle = Math.atan2(nextY - last.y, nextX - last.x) + Math.PI + (Math.random() - 0.5) * 1.2;
      spawnParticle(x, y, 22 + Math.random() * 64, angle, 0.55 + Math.random() * 0.5);
    }

    previousPointer = { x: nextX, y: nextY };
    requestFrame();
  };

  const onPointerLeave = () => clearEffect();
  const onScatter = () => clearEffect();
  const onScan = (event) => {
    const center = recordCenter(stageElement, event.detail.record);
    pointer.set(center.x, center.y);
    burstAt(center.x, center.y);
  };
  const onContextLost = (event) => {
    event.preventDefault();
    destroy();
  };

  const destroy = () => {
    if (disposed) return;
    clearEffect();
    disposed = true;
    stageElement.removeEventListener("pointermove", onPointerMove);
    stageElement.removeEventListener("pointerleave", onPointerLeave);
    stageElement.removeEventListener("pointercancel", onPointerLeave);
    stageElement.removeEventListener("recordorganizer:scatter", onScatter);
    stageElement.removeEventListener("recordorganizer:scan", onScan);
    layer.canvas.removeEventListener("webglcontextlost", onContextLost);
    window.removeEventListener("pagehide", destroy);
    layer.dispose();
  };

  stageElement.addEventListener("pointermove", onPointerMove, { passive: true });
  stageElement.addEventListener("pointerleave", onPointerLeave);
  stageElement.addEventListener("pointercancel", onPointerLeave);
  stageElement.addEventListener("recordorganizer:scatter", onScatter);
  stageElement.addEventListener("recordorganizer:scan", onScan);
  layer.canvas.addEventListener("webglcontextlost", onContextLost);
  window.addEventListener("pagehide", destroy, { once: true });
  render();
}
