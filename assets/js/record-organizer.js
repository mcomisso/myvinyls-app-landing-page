document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector("[data-record-organizer]");
  if (!stage) return;

  const layer = stage.querySelector("[data-record-layer]");
  const grid = stage.querySelector("[data-organized-grid]");
  const count = stage.querySelector("[data-organized-count]");
  const reset = stage.querySelector("[data-organizer-reset]");
  const phone = stage.querySelector("[data-scanner-phone]");
  const phoneCover = stage.querySelector("[data-scanner-cover]");
  const foundCard = stage.querySelector("[data-found-card]");
  const foundTitle = stage.querySelector("[data-found-title]");
  const foundArtist = stage.querySelector("[data-found-artist]");
  const liveRegion = stage.querySelector("[data-organizer-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const cursorScanner = stage.dataset.cursorScanner === "true";

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
  let phoneFrameRequest = null;
  let pendingPhonePosition = null;

  const setCount = () => {
    count.textContent = `${organizedCount} ${organizedCount === 1 ? "record" : "records"} organized`;
  };

  const applyRecordPosition = (record, position) => {
    record.style.transform = `translate3d(${position.x}px, ${position.y}px, ${position.depth}px) rotateZ(${position.rotate}deg)`;
  };

  const measureSlotPosition = (slotIndex) => {
    const slot = grid.children[slotIndex];
    if (!slot) return null;
    const stageRect = stage.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    return {
      x: slotRect.left - stageRect.left,
      y: slotRect.top - stageRect.top,
      rotate: 0,
      depth: 40
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
          depth: 40
        };
      }

      const position = scatteredLayout[index % scatteredLayout.length];
      return {
        record,
        x: ((stageRect.width - recordSize) * position.x) / 100,
        y: ((stageRect.height - recordSize) * position.y) / 100,
        rotate: position.rotate,
        depth: position.depth
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

  const flushPhonePosition = () => {
    phoneFrameRequest = null;
    const position = pendingPhonePosition;
    pendingPhonePosition = null;
    if (!position) return;

    const rect = stage.getBoundingClientRect();
    const phoneWidth = phone.offsetWidth;
    const phoneHeight = phone.offsetHeight;
    const x = Math.min(Math.max(position.clientX - rect.left + 18, 4), rect.width - phoneWidth - 4);
    const y = Math.min(Math.max(position.clientY - rect.top - phoneHeight / 2, 86), rect.height - phoneHeight - 8);
    phone.style.transform = `translate3d(${x}px, ${y}px, 90px) rotateZ(8deg) rotateY(-7deg)`;
    phone.classList.add("is-visible");
  };

  const schedulePhoneMove = (event) => {
    if (coarsePointer || reducedMotion) return;
    pendingPhonePosition = { clientX: event.clientX, clientY: event.clientY };
    if (phoneFrameRequest !== null) return;
    phoneFrameRequest = requestAnimationFrame(flushPhonePosition);
  };

  const organize = (record) => {
    if (record.classList.contains("is-organized") || record.classList.contains("is-scanning")) return;
    if (organizedCount >= grid.children.length) return;

    const currentSequence = ++scanSequence;
    const slotIndex = organizedCount;
    organizedCount += 1;
    record.dataset.slot = slotIndex;
    record.classList.add("is-scanning");
    if (!cursorScanner) {
      phoneCover.src = record.dataset.artwork;
      phoneCover.alt = "";
      foundTitle.textContent = record.dataset.title;
      foundArtist.textContent = record.dataset.artist;
      foundCard.classList.add("is-visible");
      phone.classList.add("is-scanning", "is-visible");
    }
    liveRegion.textContent = `Scanning ${record.dataset.title} by ${record.dataset.artist}`;
    setCount();

    window.setTimeout(() => {
      const position = measureSlotPosition(slotIndex);
      record.classList.remove("is-scanning");
      record.classList.add("is-organized");
      record.setAttribute("aria-label", `${record.dataset.title} by ${record.dataset.artist}, organized`);
      if (position) applyRecordPosition(record, position);
      liveRegion.textContent = `${record.dataset.title} by ${record.dataset.artist} added to the organized collection`;
      if (!cursorScanner && currentSequence === scanSequence) phone.classList.remove("is-scanning");
    }, reducedMotion ? 0 : 620);
  };

  const scatterAll = () => {
    scanSequence += 1;
    organizedCount = 0;
    records.forEach((record) => {
      record.classList.remove("is-organized", "is-scanning");
      delete record.dataset.slot;
      record.setAttribute("aria-label", `Scan ${record.dataset.title} by ${record.dataset.artist}`);
    });
    if (!cursorScanner) {
      phone.classList.remove("is-scanning");
      foundCard.classList.remove("is-visible");
    }
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

  if (!cursorScanner) {
    stage.addEventListener("pointermove", schedulePhoneMove);
    stage.addEventListener("pointerleave", () => {
      pendingPhonePosition = null;
      if (phoneFrameRequest !== null) {
        cancelAnimationFrame(phoneFrameRequest);
        phoneFrameRequest = null;
      }
      if (!phone.classList.contains("is-scanning")) phone.classList.remove("is-visible");
    });
  }
  reset.addEventListener("click", scatterAll);
  window.addEventListener("resize", scheduleLayout, { passive: true });
  setCount();
});
