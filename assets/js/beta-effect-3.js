import {
  createThreeLayer,
  loadTexture,
  recordCenter,
  waitForOrganizer
} from "./three-effect-utils.js";

const stage = document.querySelector("[data-record-organizer]");

if (stage) {
  waitForOrganizer(stage, async (records) => {
    // Keep the WebGL surface below the DOM layer. Firefox can composite a
    // transparent, foreground WebGL canvas as an opaque rectangle mid-frame.
    const layer = await createThreeLayer(stage);
    if (!layer) return;

    const { THREE, scene, render } = layer;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const bodies = [];
    let animationFrame = null;
    let runSequence = 0;
    let texturesReady = false;
    let queuedScatter = false;
    let userHasInteracted = false;
    let disposed = false;

    const revealRecords = () => {
      records.forEach((record) => record.classList.remove("is-effect-hidden"));
    };

    const hideRecords = () => {
      records.forEach((record) => record.classList.add("is-effect-hidden"));
    };

    const stopAnimation = ({ reveal = true } = {}) => {
      runSequence += 1;
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      bodies.forEach((body) => {
        body.mesh.visible = false;
      });
      if (reveal) revealRecords();
      render();
    };

    const readTarget = (record) => {
      const center = recordCenter(stage, record);
      const rotationMatch = record.style.transform.match(/rotateZ\((-?[\d.]+)deg\)/);
      return {
        x: center.x,
        y: center.y,
        size: record.offsetWidth || center.size,
        rotation: THREE.MathUtils.degToRad(Number(rotationMatch?.[1] || 0))
      };
    };

    const refreshTargets = () => {
      bodies.forEach((body) => {
        body.target = readTarget(body.record);
        // The shared orthographic camera uses DOM-style, downward-positive Y.
        // Mirror the plane vertically so artwork remains upright in that space.
        body.mesh.scale.set(body.target.size, -body.target.size, 1);
      });
    };

    const afterOrganizerLayout = (callback) => {
      requestAnimationFrame(() => requestAnimationFrame(callback));
    };

    const finishDrop = (sequence) => {
      if (sequence !== runSequence) return;
      bodies.forEach((body) => {
        body.mesh.position.set(body.target.x, body.target.y, body.mesh.position.z);
        body.mesh.rotation.z = body.target.rotation;
        body.mesh.visible = false;
      });
      revealRecords();
      animationFrame = null;
      render();
    };

    const beginDrop = () => {
      if (!texturesReady || disposed) {
        queuedScatter = true;
        return;
      }

      stopAnimation();
      const sequence = runSequence;
      const { width } = layer.getSize();

      refreshTargets();
      bodies.forEach((body, index) => {
        const horizontalRange = Math.min(width * 0.24, 230);
        body.x = Math.max(
          body.target.size / 2,
          Math.min(
            width - body.target.size / 2,
            body.target.x + (Math.random() - 0.5) * horizontalRange * 2
          )
        );
        body.y = -body.target.size * (0.65 + Math.random() * 1.4) - index * 9;
        body.vx = (Math.random() - 0.5) * 260;
        body.vy = 40 + Math.random() * 150;
        body.angle = body.target.rotation + (Math.random() - 0.5) * 1.9;
        body.angularVelocity = (Math.random() - 0.5) * 5.5;
        body.bounces = 0;
        body.settled = false;
        body.mesh.position.set(body.x, body.y, 50 + index * 0.1);
        body.mesh.rotation.z = body.angle;
        body.mesh.visible = true;
      });

      render();
      hideRecords();

      const startedAt = performance.now();
      let previousTime = startedAt;

      const animate = (time) => {
        if (sequence !== runSequence || disposed) return;

        const elapsed = (time - startedAt) / 1000;
        const delta = Math.min((time - previousTime) / 1000, 1 / 30);
        previousTime = time;
        let allSettled = true;

        bodies.forEach((body, index) => {
          const delay = index * 0.035;
          if (elapsed < delay) {
            allSettled = false;
            return;
          }
          if (body.settled) return;

          allSettled = false;
          const horizontalSpring = (body.target.x - body.x) * 14;
          body.vx = (body.vx + horizontalSpring * delta) * Math.exp(-3.4 * delta);
          body.x += body.vx * delta;
          body.vy += 1560 * delta;
          body.y += body.vy * delta;

          const angleDifference = body.target.rotation - body.angle;
          body.angularVelocity = (
            body.angularVelocity + angleDifference * 20 * delta
          ) * Math.exp(-3.2 * delta);
          body.angle += body.angularVelocity * delta;

          if (body.y >= body.target.y) {
            body.y = body.target.y;
            if (body.bounces < 2 && Math.abs(body.vy) > 95) {
              body.vy *= -(0.22 + Math.random() * 0.08);
              body.vx *= 0.74;
              body.angularVelocity *= 0.58;
              body.bounces += 1;
            } else {
              body.vy = 0;
              body.x += (body.target.x - body.x) * Math.min(1, delta * 12);
              body.angle += angleDifference * Math.min(1, delta * 13);
              if (
                Math.abs(body.x - body.target.x) < 0.75 &&
                Math.abs(body.vx) < 5 &&
                Math.abs(body.angle - body.target.rotation) < 0.008 &&
                Math.abs(body.angularVelocity) < 0.04
              ) {
                body.x = body.target.x;
                body.angle = body.target.rotation;
                body.settled = true;
              }
            }
          }

          body.mesh.position.x = body.x;
          body.mesh.position.y = body.y;
          body.mesh.rotation.z = body.angle;
        });

        render();
        if (allSettled || elapsed > 2.45) {
          finishDrop(sequence);
          return;
        }
        animationFrame = requestAnimationFrame(animate);
      };

      animationFrame = requestAnimationFrame(animate);
    };

    const onScatter = () => {
      queuedScatter = true;
      afterOrganizerLayout(() => {
        if (!queuedScatter) return;
        queuedScatter = false;
        beginDrop();
      });
    };

    const onScan = () => {
      userHasInteracted = true;
      queuedScatter = false;
      stopAnimation();
    };

    const onResize = () => {
      afterOrganizerLayout(() => {
        if (disposed) return;
        refreshTargets();
        if (animationFrame === null) render();
      });
    };

    stage.addEventListener("recordorganizer:scatter", onScatter);
    stage.addEventListener("recordorganizer:scan", onScan);
    window.addEventListener("resize", onResize, { passive: true });

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stopAnimation();
      stage.removeEventListener("recordorganizer:scatter", onScatter);
      stage.removeEventListener("recordorganizer:scan", onScan);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      layer.dispose();
    };

    window.addEventListener("pagehide", dispose, { once: true });

    const textureResults = await Promise.allSettled(
      records.map((record) => loadTexture(THREE, record.dataset.artwork))
    );

    if (disposed) {
      textureResults.forEach((result) => {
        if (result.status === "fulfilled") result.value.dispose();
      });
      return;
    }

    if (textureResults.some((result) => result.status === "rejected")) {
      textureResults.forEach((result) => {
        if (result.status === "fulfilled") result.value.dispose();
      });
      dispose();
      return;
    }

    textureResults.forEach((result, index) => {
      const material = new THREE.MeshBasicMaterial({
        map: result.value,
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);
      bodies.push({
        record: records[index],
        mesh,
        target: readTarget(records[index])
      });
    });

    texturesReady = true;
    if (queuedScatter || !userHasInteracted) {
      queuedScatter = false;
      afterOrganizerLayout(beginDrop);
    }
  });
}
