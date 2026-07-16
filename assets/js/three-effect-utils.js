const THREE_MODULE_URL = "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js";

export const waitForOrganizer = (stage, callback) => {
  const records = [...stage.querySelectorAll(".record-sleeve")];
  if (records.length) {
    callback(records);
    return;
  }

  stage.addEventListener("recordorganizer:ready", (event) => callback(event.detail.records), { once: true });
};

export const createThreeLayer = async (stage, { foreground = false } = {}) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  const probe = document.createElement("canvas");
  if (!probe.getContext("webgl2")) return null;

  let THREE;
  try {
    THREE = await import(THREE_MODULE_URL);
  } catch {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.className = `record-effects-canvas${foreground ? " is-foreground" : ""}`;
  canvas.setAttribute("aria-hidden", "true");
  stage.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: true
    });
  } catch {
    canvas.remove();
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  camera.position.z = 100;
  let width = 1;
  let height = 1;
  let visible = true;

  const resize = () => {
    width = Math.max(stage.clientWidth, 1);
    height = Math.max(stage.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = height;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (visible && !document.hidden) renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    render();
  });
  resizeObserver.observe(stage);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  visibilityObserver.observe(stage);

  resize();
  stage.classList.add("has-three-effects");

  const dispose = () => {
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    scene.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
      if (object.material?.map) object.material.map.dispose();
    });
    renderer.dispose();
    canvas.remove();
  };

  return { THREE, canvas, renderer, scene, camera, render, resize, dispose, getSize: () => ({ width, height }) };
};

export const loadTexture = (THREE, url) => new Promise((resolve, reject) => {
  new THREE.TextureLoader().load(url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    resolve(texture);
  }, undefined, reject);
});

export const recordCenter = (stage, record) => {
  const stageRect = stage.getBoundingClientRect();
  const recordRect = record.getBoundingClientRect();
  return {
    x: recordRect.left - stageRect.left + recordRect.width / 2,
    y: recordRect.top - stageRect.top + recordRect.height / 2,
    size: recordRect.width
  };
};
