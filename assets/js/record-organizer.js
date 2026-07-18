document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector("[data-record-organizer]");
  if (!stage) return;

  const layer = stage.querySelector("[data-record-layer]");
  const grid = stage.querySelector("[data-organized-grid]");
  const count = stage.querySelector("[data-organized-count]");
  const phoneCount = stage.querySelector("[data-phone-count]");
  const reset = stage.querySelector("[data-organizer-reset]");
  const liveRegion = stage.querySelector("[data-organizer-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scatteredLayout = [
    { x: 3, y: 63, rotate: -12, depth: 8 },
    { x: 19, y: 74, rotate: 8, depth: 22 },
    { x: 36, y: 59, rotate: -6, depth: 14 },
    { x: 54, y: 76, rotate: 13, depth: 30 },
    { x: 73, y: 60, rotate: -9, depth: 12 },
    { x: 84, y: 77, rotate: 7, depth: 20 },
    { x: 8, y: 86, rotate: 5, depth: 26 },
    { x: 29, y: 87, rotate: -11, depth: 10 },
    { x: 62, y: 88, rotate: 9, depth: 18 },
    { x: 80, y: 91, rotate: -5, depth: 24 }
  ];

  let records = [];
  let organizedCount = 0;
  let scanSequence = 0;
  let layoutFrameRequest = null;

  const setCount = () => {
    count.textContent = `${organizedCount} ${organizedCount === 1 ? "record" : "records"} scanned`;
    phoneCount.textContent = `${organizedCount} ${organizedCount === 1 ? "VINYL" : "VINYLS"}`;
  };

  const applyRecordPosition = (record, position) => {
    record.style.transform = `translate3d(${position.x}px, ${position.y}px, ${position.depth}px) rotateZ(${position.rotate}deg) scale(${position.scale ?? 1})`;
  };

  const measureSlotPosition = (record, slotIndex) => {
    const slot = grid.children[slotIndex];
    if (!slot) return null;
    const stageRect = stage.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    return {
      x: slotRect.left - stageRect.left,
      y: slotRect.top - stageRect.top,
      rotate: 0,
      depth: 40,
      scale: slotRect.width / record.offsetWidth
    };
  };

  const measureRecordPositions = () => {
    const stageRect = stage.getBoundingClientRect();
    const recordSize = records[0]?.offsetWidth ?? 0;

    return records.map((record, index) => {
      if (record.classList.contains("is-organized")) {
        const slot = grid.children[Number(record.dataset.slot)];
        if (!slot) return null;
        const slotRect = slot.getBoundingClientRect();
        return {
          record,
          x: slotRect.left - stageRect.left,
          y: slotRect.top - stageRect.top,
          rotate: 0,
          depth: 40,
          scale: slotRect.width / recordSize
        };
      }

      const position = scatteredLayout[index % scatteredLayout.length];
      return {
        record,
        x: ((stageRect.width - recordSize) * position.x) / 100,
        y: ((stageRect.height - recordSize) * position.y) / 100,
        rotate: position.rotate,
        depth: position.depth,
        scale: 1
      };
    });
  };

  const applyRecordPositions = (positions) => {
    positions.forEach((position) => {
      if (position) applyRecordPosition(position.record, position);
    });
  };

  const layoutRecords = () => {
    const positions = measureRecordPositions();
    applyRecordPositions(positions);
  };

  const scheduleLayout = () => {
    if (layoutFrameRequest !== null) return;
    layoutFrameRequest = requestAnimationFrame(() => {
      layoutFrameRequest = null;
      layoutRecords();
    });
  };

  const organize = (record) => {
    if (record.classList.contains("is-organized") || record.classList.contains("is-scanning")) return;
    if (organizedCount >= grid.children.length) return;

    const scanToken = String(++scanSequence);
    const slotIndex = organizedCount;
    organizedCount += 1;
    record.dataset.slot = slotIndex;
    record.dataset.scanToken = scanToken;
    record.classList.add("is-scanning");
    liveRegion.textContent = `Scanning ${record.dataset.title} by ${record.dataset.artist}`;
    setCount();

    window.setTimeout(() => {
      if (record.dataset.scanToken !== scanToken) return;
      const position = measureSlotPosition(record, slotIndex);
      record.classList.remove("is-scanning");
      record.classList.add("is-organized", "has-landed");
      record.setAttribute("aria-label", `${record.dataset.title} by ${record.dataset.artist}, organized`);
      if (position) applyRecordPosition(record, position);
      const slot = grid.children[slotIndex];
      if (slot) {
        slot.querySelector("img").src = record.dataset.artwork;
        slot.querySelector("strong").textContent = record.dataset.title;
        slot.querySelector("small").textContent = record.dataset.artist;
        slot.classList.add("is-filled");
      }
      liveRegion.textContent = `${record.dataset.title} by ${record.dataset.artist} added to the organized collection`;
    }, reducedMotion ? 0 : 780);
  };

  const scatterAll = () => {
    scanSequence += 1;
    organizedCount = 0;
    records.forEach((record) => {
      record.classList.remove("is-organized", "is-scanning", "has-landed");
      delete record.dataset.slot;
      delete record.dataset.scanToken;
      record.setAttribute("aria-label", `Scan ${record.dataset.title} by ${record.dataset.artist}`);
    });
    Array.from(grid.children).forEach((slot) => {
      slot.classList.remove("is-filled");
      slot.querySelector("img").removeAttribute("src");
      slot.querySelector("strong").textContent = "";
      slot.querySelector("small").textContent = "";
    });
    liveRegion.textContent = "The records are scattered again";
    setCount();
    scheduleLayout();
  };

  const makeRecord = (album, index) => {
    const record = document.createElement("button");
    const artwork = document.createElement("img");
    const scanLine = document.createElement("span");

    record.type = "button";
    record.className = "record-sleeve";
    record.dataset.title = album.name;
    record.dataset.artist = album.artist;
    record.dataset.artwork = album.artwork;
    record.setAttribute("aria-label", `Scan ${album.name} by ${album.artist}`);
    artwork.src = album.artwork;
    artwork.alt = `${album.name} by ${album.artist}`;
    artwork.width = 240;
    artwork.height = 240;
    if (index > 3) artwork.loading = "lazy";
    scanLine.className = "record-sleeve__scan";
    scanLine.setAttribute("aria-hidden", "true");
    record.append(artwork, scanLine);
    record.addEventListener("pointerenter", () => organize(record));
    record.addEventListener("focus", () => organize(record));
    record.addEventListener("click", () => organize(record));
    return record;
  };

  fetch(stage.dataset.feed)
    .then((response) => {
      if (!response.ok) throw new Error(`Feed request failed with ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      payload.albums.slice(0, scatteredLayout.length).forEach((album, index) => {
        const record = makeRecord(album, index);
        records.push(record);
        layer.appendChild(record);
      });

      requestAnimationFrame(() => {
        layoutRecords();
        if (reducedMotion) records.slice(0, grid.children.length).forEach(organize);
      });
    })
    .catch(() => {
      liveRegion.textContent = "The prototype record feed is unavailable";
      stage.classList.add("has-feed-error");
    });

  reset.addEventListener("click", scatterAll);
  window.addEventListener("resize", scheduleLayout, { passive: true });
  setCount();
});
