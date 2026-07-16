import { createThreeLayer, recordCenter, waitForOrganizer } from "./three-effect-utils.js";

const stage = document.querySelector("[data-record-organizer]");

if (stage) {
  waitForOrganizer(stage, async (records) => {
    let layer;

    try {
      layer = await createThreeLayer(stage);
    } catch {
      // The organizer remains fully usable when Three.js or WebGL is unavailable.
      return;
    }

    if (!layer || !stage.isConnected) {
      layer?.dispose();
      return;
    }

    const { THREE, scene, render } = layer;
    const discGeometry = new THREE.CircleGeometry(0.5, 96);
    const labelGeometry = new THREE.CircleGeometry(0.16, 48);
    const spindleGeometry = new THREE.CircleGeometry(0.021, 24);
    const haloGeometry = new THREE.RingGeometry(0.5, 0.57, 72);
    const accents = [0xd47f66, 0xe7aa62, 0x6d91a7, 0xca7187, 0x82a687];

    const makeVinylMaterial = () => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uGlintAngle: { value: 0 },
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
        uniform float uGlintAngle;
        uniform float uOpacity;

        void main() {
          vec2 point = vUv - 0.5;
          float radius = length(point);
          if (radius > 0.5) discard;

          float angle = atan(point.y, point.x);
          float grooveWave = 0.5 + 0.5 * sin(radius * 1050.0);
          float grooves = smoothstep(0.62, 0.98, grooveWave) * 0.075;
          float glintDirection = max(cos(angle - uGlintAngle), 0.0);
          float glint = pow(glintDirection, 16.0)
            * smoothstep(0.09, 0.2, radius)
            * (1.0 - smoothstep(0.38, 0.5, radius));
          float rim = smoothstep(0.46, 0.495, radius);

          vec3 vinyl = vec3(0.025, 0.027, 0.03);
          vinyl += vec3(grooves);
          vinyl += vec3(0.34, 0.37, 0.4) * glint;
          vinyl += vec3(0.08) * rim;
          gl_FragColor = vec4(vinyl, uOpacity);
        }
      `
    });

    const makeBasicMaterial = (color) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const states = records.map((record, index) => {
      const group = new THREE.Group();
      const shadowMaterial = makeBasicMaterial(0x251b18);
      const vinylMaterial = makeVinylMaterial();
      const labelMaterial = makeBasicMaterial(accents[index % accents.length]);
      const spindleMaterial = makeBasicMaterial(0xf3e9df);
      const haloMaterial = makeBasicMaterial(accents[index % accents.length]);
      const shadow = new THREE.Mesh(discGeometry, shadowMaterial);
      const disc = new THREE.Mesh(discGeometry, vinylMaterial);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      const spindle = new THREE.Mesh(spindleGeometry, spindleMaterial);
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);

      shadow.scale.setScalar(1.07);
      shadow.position.set(0.035, 0.06, -2);
      disc.position.z = 0;
      label.position.z = 1;
      spindle.position.z = 2;
      halo.position.z = -1;
      group.add(shadow, disc, label, spindle, halo);
      group.visible = false;
      scene.add(group);

      return {
        record,
        group,
        vinylMaterial,
        shadowMaterial,
        labelMaterial,
        spindleMaterial,
        haloMaterial,
        reveal: 0.12,
        target: 0.12,
        burst: 0,
        rotation: index * 0.47,
        spin: 0,
        scanUntil: 0,
        followUntil: 0,
        hovered: false,
        focused: false
      };
    });

    const byRecord = new Map(states.map((state) => [state.record, state]));
    let animationFrame = null;
    let previousTime = performance.now();

    const updatePosition = (state) => {
      const center = recordCenter(stage, state.record);
      const easedReveal = 1 - Math.pow(1 - state.reveal, 3);

      state.group.position.set(
        center.x + center.size * 0.66 * easedReveal,
        center.y,
        0
      );
      state.group.scale.setScalar(center.size * (0.98 + easedReveal * 0.12));
    };

    const drawFrame = (time) => {
      animationFrame = null;
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      let stillAnimating = false;

      states.forEach((state) => {
        const isScanning = time < state.scanUntil;
        const canReveal = !state.record.classList.contains("is-organized");
        state.target = canReveal && (isScanning || state.hovered || state.focused)
          ? 1
          : canReveal ? 0.12 : 0;

        const revealSpeed = state.target > state.reveal ? 10 : 7;
        const revealStep = 1 - Math.exp(-revealSpeed * delta);
        state.reveal += (state.target - state.reveal) * revealStep;
        if (Math.abs(state.target - state.reveal) < 0.002) state.reveal = state.target;

        state.spin *= Math.exp(-3.8 * delta);
        state.rotation += state.spin * delta;
        state.burst = Math.max(0, state.burst - delta * 1.8);

        const visible = state.reveal > 0.001 || state.burst > 0.001;
        state.group.visible = visible;
        if (visible || time < state.followUntil) updatePosition(state);

        const opacity = Math.min(state.reveal * 4, 1);
        state.group.rotation.z = state.rotation;
        state.vinylMaterial.uniforms.uGlintAngle.value = state.rotation * 0.7 + time * 0.0016;
        state.vinylMaterial.uniforms.uOpacity.value = opacity;
        state.shadowMaterial.opacity = opacity * 0.28;
        state.labelMaterial.opacity = opacity;
        state.spindleMaterial.opacity = opacity * 0.95;
        state.haloMaterial.opacity = Math.min(
          state.reveal * 0.24 + Math.sin(state.burst * Math.PI) * 0.72,
          0.78
        );

        if (
          Math.abs(state.target - state.reveal) >= 0.002
          || state.spin > 0.015
          || state.burst > 0.001
          || isScanning
          || time < state.followUntil
        ) {
          stillAnimating = true;
        }
      });

      render();
      if (stillAnimating) animationFrame = requestAnimationFrame(drawFrame);
    };

    const animate = () => {
      if (animationFrame !== null) return;
      previousTime = performance.now();
      animationFrame = requestAnimationFrame(drawFrame);
    };

    states.forEach((state) => {
      state.record.addEventListener("pointerenter", () => {
        state.hovered = true;
        state.spin = Math.max(state.spin, 5.2);
        animate();
      });
      state.record.addEventListener("pointerleave", () => {
        state.hovered = false;
        animate();
      });
      state.record.addEventListener("focus", () => {
        state.focused = true;
        state.spin = Math.max(state.spin, 5.2);
        animate();
      });
      state.record.addEventListener("blur", () => {
        state.focused = false;
        animate();
      });
    });

    stage.addEventListener("recordorganizer:scan", (event) => {
      const state = byRecord.get(event.detail.record);
      if (!state) return;
      state.scanUntil = performance.now() + 720;
      state.spin = 11;
      animate();
    });

    stage.addEventListener("recordorganizer:organized", (event) => {
      const state = byRecord.get(event.detail.record);
      if (!state) return;
      state.scanUntil = 0;
      state.burst = 1;
      state.followUntil = performance.now() + 760;
      animate();
    });

    stage.addEventListener("recordorganizer:scatter", () => {
      const now = performance.now();
      states.forEach((state) => {
        state.scanUntil = 0;
        state.burst = 0;
        state.followUntil = now + 850;
      });
      animate();
    });

    window.addEventListener("resize", animate, { passive: true });
    window.addEventListener("pagehide", () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      layer.dispose();
    }, { once: true });

    states.forEach((state) => {
      state.group.visible = true;
      updatePosition(state);
      state.vinylMaterial.uniforms.uOpacity.value = 0.48;
      state.shadowMaterial.opacity = 0.13;
      state.labelMaterial.opacity = 0.48;
      state.spindleMaterial.opacity = 0.46;
      state.haloMaterial.opacity = 0.03;
    });
    render();
  });
}
